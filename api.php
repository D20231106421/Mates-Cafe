<?php

$path = urldecode($_GET['_path'] ?? '/bootstrap');
$path = '/api/mates-cafe/'.ltrim($path, '/');

unset($_GET['_path'], $_REQUEST['_path']);

$_SERVER['REQUEST_URI'] = $path;
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require __DIR__.'/public/index.php';
