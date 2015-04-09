<?php	

error_reporting(0);
ini_set('max_execution_time', 70);
set_time_limit(0);
libxml_use_internal_errors(true);
$oldnumlaps = $_REQUEST['numlaps'];
$trackid = $_REQUEST['trackid'];
$transponderid = $_REQUEST['transponderid'];
$stopts = time() + 10;

function pollmylaps($trackid,$transponderid) {
	try {
		$content = file_get_contents('http://practice.mylaps.com/practice/showLaptimes.jsp?tid='.$trackid.'&transponder='.$transponderid, "r");
//echo $content;
 		if ( strlen($content) == 0 ) {
				return array('event' => 'message', 'message' => 'Insufficient data');				
		}	
		
		$DOM = new DOMDocument();
		$DOM->loadHTML($content);
		$tables= $DOM->getElementsByTagName('table');
		list ($bestlaptime) = split(' ',$tables->item(1)->getElementsByTagName('td')->item(1)->nodeValue);
 //       echo $bestlaptime;
		list ($numlaps) = split(' ',$tables->item(1)->getElementsByTagName('td')->item(5)->nodeValue);

		$tds = $tables->item($tables->length - 1)->getElementsByTagName('td');
//		$numlaps = $tds->item($tds->length - 4)->nodeValue;	
		$laptime = $tds->item($tds->length - 2)->nodeValue;

		
//		$string = $DOM->getElementsByTagName('h3')->item(1)->nodeValue;		
//		echo $string;
//		preg_match('/.*[^1-9](\d+ [A-Z][a-z]{2} \d{4}).*/',$string,$matches);
//		$date = $matches[1];
//                $date = "12";
		
		$headers = $DOM->getElementsByTagName('h4');		
//		print '<pre>'. $headers->item($headers->length - 1)->nodeValue . '</pre>';
		$string = preg_replace('/\s+/', '', $headers->item($headers->length - 1)->nodeValue);
//		print '<pre>'. $string . '</pre>';
//		preg_match('/^Session \d+ started at ([0-9\:]+)/',$headers->item($headers->length - 1)->nodeValue,$matches);
		preg_match('/.*(\d{2}\:\d{2}\:\d{2}).*/',$string,$matches);		
		$time = $matches[1];
//		
//		if ( strlen($date) == 0 ) {
//			return array('event' => 'message', 'message' => 'date empty');				
//		}		
		if ( strlen($time) == 0 ) {
			return array('event' => 'message', 'message' => 'time empty');				
		}		
		if ( strlen($numlaps) == 0 ) {
			return array('event' => 'message', 'message' => 'numlaps empty');				
		}
		if ( strlen($laptime) == 0 ) {
			return array('event' => 'message','message' => 'laptime empty');				
		}
		if ( strlen($bestlaptime) == 0 ) {
			if ( $numlaps == 0 ) {
				return array('event'=>'lap','data' => array('laptime'=>$laptime,'numlaps'=>$numlaps,'bestlaptime'=>"--",'date'=>$date,'time'=>$time));
			} else {	
				return array('event' => 'message','message' => 'best laptime empty');				
			}
		}
		return array('event'=>'lap','data' => array('laptime'=>$laptime,'numlaps'=>$numlaps,'bestlaptime'=>$bestlaptime,'time'=>$time));
	} catch ( Exception $e ) {
		return array('event'=>'message','message' => $e->getMessage());
	}
	
	return array();
}



function oldpollmylaps($trackid,$transponderid) {
	try {
		$content = file_get_contents('http://practice.mylaps.com/practice/showLaptimes.jsp?tid='.$trackid.'&transponder='.$transponderid, "r");
		if ( strlen($content) == 0 ) {
				return array('event' => 'message', 'message' => 'Insufficient data');				
		}	
		
		$DOM = new DOMDocument();
		$DOM->loadHTML($content);
		$tables= $DOM->getElementsByTagName('table');
		list ($bestlaptime) = split(' ',$tables->item(1)->getElementsByTagName('td')->item(1)->nodeValue);
		list ($numlaps) = split(' ',$tables->item(1)->getElementsByTagName('td')->item(5)->nodeValue);

		$tds = $tables->item($tables->length - 1)->getElementsByTagName('td');
//		$numlaps = $tds->item($tds->length - 4)->nodeValue;	
		$laptime = $tds->item($tds->length - 2)->nodeValue;
		
		if ( strlen($numlaps) == 0 ) {
			return array('event' => 'message', 'message' => 'numlaps empty');				
		}
		if ( strlen($laptime) == 0 ) {
			return array('event' => 'message','message' => 'laptime empty');				
		}
		if ( strlen($bestlaptime) == 0 ) {
			return array('event' => 'message','message' => 'best laptime empty');				
		}
	
		return array('event'=>'lap','data' => array('laptime'=>$laptime,'numlaps'=>$numlaps,'bestlaptime'=>$bestlaptime));
	} catch ( Exception $e ) {
		return array('event'=>'message','message' => $e->getMessage());
	}
	
	return array();
}


$continue = true;
while ( $continue ) {
	$result = pollmylaps($trackid,$transponderid);		
	if (
		( $result['event'] == 'message' ) ||
		(
			( $result['event'] == 'lap' ) &&
			( $result['data']['numlaps'] != $oldnumlaps )
		)
		) {
		$json = json_encode($result);	
		echo $json;
		$continue = false;
	} else if ( time() > $stopts ) {
		$continue = false;
	} else {
		sleep(6);
	}
}
