<?php
/*
 * Generic, whitelisted table editor for the admin panel.
 *
 *   GET  ?action=tables
 *   GET  ?action=rows&table=T&page=1&q=search
 *   POST action=insert|update|delete  table=T  (+ fields / pk[...])
 *
 * Table and column names are only ever taken from the live schema
 * (never interpolated from user input), and all values are bound.
 * users.password is never returned; it can only be replaced via "new_password".
 * Writes require the acting admin's password.
 */
require_once __DIR__ . "/_bootstrap.php";

const ALLOWED_TABLES = ["users", "properties", "bookings", "payments", "favorites"];
const PAGE_SIZE = 25;

function existing_tables(mysqli $conn): array
{
    $found = [];
    $res = $conn->query("SHOW TABLES");
    while ($res && ($r = $res->fetch_row())) {
        if (in_array($r[0], ALLOWED_TABLES, true)) $found[] = $r[0];
    }
    return $found;
}

function table_columns(mysqli $conn, string $table): array
{
    $cols = [];
    $res = $conn->query("SHOW COLUMNS FROM `$table`");
    while ($res && ($r = $res->fetch_assoc())) {
        $cols[$r["Field"]] = [
            "name" => $r["Field"],
            "type" => $r["Type"],
            "nullable" => $r["Null"] === "YES",
            "pk" => $r["Key"] === "PRI",
            "auto" => stripos($r["Extra"], "auto_increment") !== false,
            "generated" => stripos($r["Extra"], "GENERATED") !== false,
            "hidden" => ($table === "users" && $r["Field"] === "password"),
        ];
    }
    return $cols;
}

function resolve_table(mysqli $conn): string
{
    $table = $_REQUEST["table"] ?? "";
    if (!in_array($table, existing_tables($conn), true)) {
        json_out(["success" => false, "message" => "Unknown table."], 400);
    }
    return $table;
}

function confirm_password(mysqli $conn, int $admin_id): void
{
    $pw = $_POST["current_password"] ?? "";
    $stmt = $conn->prepare("SELECT password FROM users WHERE user_id = ? LIMIT 1");
    $stmt->bind_param("i", $admin_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($pw === "" || !$row || !password_verify($pw, $row["password"])) {
        json_out(["success" => false, "message" => "Incorrect password."], 403);
    }
}

function bind_all(mysqli_stmt $stmt, array $values): void
{
    if (!$values) return;
    $stmt->bind_param(str_repeat("s", count($values)), ...$values);
}

/* Value coming from the form -> value for the DB (empty string => NULL when allowed). */
function clean_value(array $col, $v)
{
    if ($v === null) return null;
    if ($v === "" && $col["nullable"]) return null;
    return (string) $v;
}

/* Build "WHERE pk1 = ? AND pk2 = ?" from posted pk[...] */
function pk_where(array $cols, array $pk): array
{
    $parts = [];
    $vals = [];
    foreach ($cols as $c) {
        if (!$c["pk"]) continue;
        if (!isset($pk[$c["name"]])) json_out(["success" => false, "message" => "Missing key: " . $c["name"]], 400);
        $parts[] = "`{$c["name"]}` = ?";
        $vals[] = (string) $pk[$c["name"]];
    }
    if (!$parts) json_out(["success" => false, "message" => "This table has no primary key and can't be edited."], 400);
    return [implode(" AND ", $parts), $vals];
}

function db_error(mysqli $conn, mysqli_stmt $stmt = null): void
{
    $msg = $stmt && $stmt->error ? $stmt->error : $conn->error;
    json_out(["success" => false, "message" => "Database error: " . $msg], 400);
}

$action = $_REQUEST["action"] ?? "";

/* ---------------- tables ---------------- */
if ($action === "tables") {
    $out = [];
    foreach (existing_tables($conn) as $t) {
        $n = $conn->query("SELECT COUNT(*) FROM `$t`")->fetch_row()[0];
        $out[] = ["name" => $t, "count" => (int) $n];
    }
    json_out(["success" => true, "tables" => $out, "admin_id" => $admin_id]);
}

/* ---------------- rows ---------------- */
if ($action === "rows") {
    $table = resolve_table($conn);
    $cols = table_columns($conn, $table);
    $visible = array_values(array_filter($cols, fn($c) => !$c["hidden"]));
    $select = implode(", ", array_map(fn($c) => "`{$c["name"]}`", $visible));

    $page = max(1, (int) ($_GET["page"] ?? 1));
    $offset = ($page - 1) * PAGE_SIZE;
    $q = trim($_GET["q"] ?? "");

    $where = "";
    $params = [];
    if ($q !== "") {
        $like = "%" . addcslashes($q, "%_\\") . "%";
        $ors = [];
        foreach ($visible as $c) {
            $ors[] = "CAST(`{$c["name"]}` AS CHAR) LIKE ?";
            $params[] = $like;
        }
        $where = "WHERE " . implode(" OR ", $ors);
    }

    $pkNames = array_keys(array_filter($cols, fn($c) => $c["pk"]));
    $order = $pkNames ? "ORDER BY " . implode(", ", array_map(fn($n) => "`$n` DESC", $pkNames)) : "";

    $stmt = $conn->prepare("SELECT COUNT(*) FROM `$table` $where");
    bind_all($stmt, $params);
    $stmt->execute();
    $total = (int) $stmt->get_result()->fetch_row()[0];
    $stmt->close();

    $stmt = $conn->prepare("SELECT $select FROM `$table` $where $order LIMIT " . PAGE_SIZE . " OFFSET $offset");
    bind_all($stmt, $params);
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $stmt->close();

    json_out([
        "success" => true,
        "columns" => array_values(array_map(fn($c) => [
            "name" => $c["name"], "type" => $c["type"], "nullable" => $c["nullable"],
            "pk" => $c["pk"], "auto" => $c["auto"], "generated" => $c["generated"],
        ], $visible)),
        "rows" => $rows,
        "total" => $total,
        "page" => $page,
        "page_size" => PAGE_SIZE,
        "can_edit_password" => $table === "users",
    ]);
}

/* ---------------- writes ---------------- */
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_out(["success" => false, "message" => "Invalid request."], 405);
}

$table = resolve_table($conn);
$cols = table_columns($conn, $table);
confirm_password($conn, $admin_id);

$fields = $_POST["fields"] ?? [];
if (!is_array($fields)) $fields = [];
$pk = $_POST["pk"] ?? [];
if (!is_array($pk)) $pk = [];

/* users-specific guards */
if ($table === "users") {
    if (isset($fields["account_type"]) && !in_array($fields["account_type"], ["user", "admin"], true)) {
        json_out(["success" => false, "message" => "account_type must be 'user' or 'admin'."], 400);
    }
    if (isset($fields["email"]) && !filter_var($fields["email"], FILTER_VALIDATE_EMAIL)) {
        json_out(["success" => false, "message" => "Please enter a valid email address."], 400);
    }
}

/* Optional password replacement for users */
$newPassword = $_POST["new_password"] ?? "";
if ($table === "users" && $newPassword !== "") {
    if (strlen($newPassword) < 8) json_out(["success" => false, "message" => "New password must be at least 8 characters."], 400);
    $fields["password"] = password_hash($newPassword, PASSWORD_DEFAULT);
} else {
    unset($fields["password"]);
}

if ($action === "insert") {
    $names = [];
    $vals = [];
    foreach ($fields as $name => $v) {
        if (!isset($cols[$name]) || $cols[$name]["auto"] || $cols[$name]["generated"]) continue;
        $names[] = "`$name`";
        $vals[] = clean_value($cols[$name], $v);
    }
    if (!$names) json_out(["success" => false, "message" => "Nothing to insert."], 400);
    if ($table === "users" && !isset($fields["password"])) {
        json_out(["success" => false, "message" => "Set a password for the new user."], 400);
    }
    $stmt = $conn->prepare("INSERT INTO `$table` (" . implode(", ", $names) . ") VALUES (" . implode(", ", array_fill(0, count($names), "?")) . ")");
    if (!$stmt) db_error($conn);
    bind_all($stmt, $vals);
    if (!$stmt->execute()) db_error($conn, $stmt);
    json_out(["success" => true, "message" => "Row added.", "id" => $stmt->insert_id]);
}

if ($action === "update") {
    [$whereSql, $whereVals] = pk_where($cols, $pk);

    /* An admin can't demote themselves (guarantees at least one admin remains). */
    if ($table === "users" && isset($pk["user_id"]) && (int) $pk["user_id"] === $admin_id
        && isset($fields["account_type"]) && $fields["account_type"] !== "admin") {
        json_out(["success" => false, "message" => "You can't remove your own admin access."], 400);
    }

    $sets = [];
    $vals = [];
    foreach ($fields as $name => $v) {
        if (!isset($cols[$name]) || $cols[$name]["pk"] || $cols[$name]["auto"] || $cols[$name]["generated"]) continue;
        $sets[] = "`$name` = ?";
        $vals[] = clean_value($cols[$name], $v);
    }
    if (!$sets) json_out(["success" => false, "message" => "No changes to save."], 400);

    $stmt = $conn->prepare("UPDATE `$table` SET " . implode(", ", $sets) . " WHERE $whereSql LIMIT 1");
    if (!$stmt) db_error($conn);
    bind_all($stmt, array_merge($vals, $whereVals));
    if (!$stmt->execute()) db_error($conn, $stmt);
    json_out(["success" => true, "message" => "Row updated."]);
}

if ($action === "delete") {
    [$whereSql, $whereVals] = pk_where($cols, $pk);

    if ($table === "users" && isset($pk["user_id"]) && (int) $pk["user_id"] === $admin_id) {
        json_out(["success" => false, "message" => "You can't delete your own account here."], 400);
    }

    $stmt = $conn->prepare("DELETE FROM `$table` WHERE $whereSql LIMIT 1");
    if (!$stmt) db_error($conn);
    bind_all($stmt, $whereVals);
    if (!$stmt->execute()) db_error($conn, $stmt);
    json_out(["success" => true, "message" => $stmt->affected_rows ? "Row deleted." : "Row not found."]);
}

json_out(["success" => false, "message" => "Unknown action."], 400);
