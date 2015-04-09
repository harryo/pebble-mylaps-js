<?php

// header('Content-type: text/plain; charset=utf-8');
header('Content-Type: application/json; charset=utf-8');

require_once ('classes/simulator.php');
$sim = new Simulator($_GET);

switch ($_GET['action']) {
    case 'lap':
        $sim->lap();
        break;

    case 'reset':
        $sim->reset();
        break;
}

print (json_encode($sim->getData()));
