<?php

$maxTime = 60;

header( 'Content-Type: application/json; charset=utf-8');

if( $_GET['trackid'] == 'sim')  {
	$interval = 3;
	require_once( 'classes/simulator.php');
	$laps = new Simulator($_GET);
} else {
	$interval = 10;
	require_once( 'classes/mylaps.php');
	$laps = new mylaps($_GET);
}

$endTime = time() + $maxTime;

while( time() < $endTime ) {
	$data = $laps->getStatus($_GET);
	if( !isset($_GET['numlaps']) || $_GET['numlaps'] != $data['numlaps'] ) {
		break;
	}
	sleep($interval);
}

if( $data['numlaps'] == 0) {
    $result = ['event' => 'message', 'message' => 'numlaps empty'];
} else {
    $result = [
        'event' => 'lap',
        'data' => $data
    ];
}

print(json_encode($result));
