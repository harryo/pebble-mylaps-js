<?php

require_once( 'classes/simple_html_dom.php');
require_once ('classes/iLaps.php');

class mylaps implements iLaps {
	private $status;

	public function __construct($par) {
        $this->par = $par;
		$this->urlBase = 'http://' .  $_SERVER['HTTP_HOST'];
	}

	public function getStatus() {
		if( isset( $this->par['activity'])) {
			$this->status['activity'] = $this->par['activity'];
		} else {
			$this->readHtml();
		}

		if( isset($this->status['activity'])) {
			$this->readActivity();
		}
		return $this->status;
	}

	protected function readHtml() {
		try {
			$url = sprintf( 'http://practice.mylaps.com/practice/showLaptimes.jsp?tid=%s&transponder=%s', $this->par['trackid'], $this->par['transponderid']);
			$content = @file_get_contents($url);
			if( $content) {
				$html = str_get_html($content);
				$sessionHeaders = $html->find('h4');
				$tableRows = $html->find('table',1)->find('tr');
				$this->status['bestlaptime'] = $this->str2ms(explode(' ', $tableRows[0]->find('td',1)->plaintext)[0]);
				$this->status['numlaps'] = explode(' ', $tableRows[2]->find('td',1)->plaintext)[0] + count($sessionHeaders) - 1;
				$this->status['totaltime'] = $this->str2ms($tableRows[3]->find('td',1)->plaintext);

				// Check if ongoing activity, i.e. date is today
				$dateStr = explode(';', $html->find('h3', 1)->plaintext)[1];
				$activityLink = $html->find('.col-2 a')[0]->href;
				if( date('Y-m-d', strtotime($dateStr)) == date('Y-m-d' ) && preg_match( '/activityID=(\d+)/', $activityLink, $match)) {
					$this->status['activity'] = $match[1];
				}
			} else {
			    $this->status['numlaps'] == 0;
			}
		} catch (Exception $e) {
		    $this->status['numlaps'] == 0;
		}
	}

	protected function readActivity() {
		$laps = $this->csv2laps($this->status['activity']);
		if( count($laps) > 0 ) {
			$totaltime = 0;
			foreach($laps as $idx => $lap) {
				$laps[$idx]['Lap'] = $idx+1;
				if( $lap['Transponder'] !== '' ) {
					$laptime = $this->str2ms($lap['Laptime']);
				} elseif ($idx > 0 && $idx+1 < count($laps)) {
					$startTime = $this->str2ms($laps[$idx-1]['Start time']) + $laptime;
					$nextTime = $this->str2ms($laps[$idx+1]['Start time']);
					$laptime = $nextTime - $startTime;
				}
				if( $idx == 0 || $laptime < $bestLap) {
					$bestLap = $laptime;
				}
				$totaltime += $laptime;
				if( isset($this->par['numlaps']) && $idx == $this->par['numlaps']) {
					$starttotal = $totaltime;
				}
			}
			$this->status['numlaps'] = count($laps);
			$this->status['bestlaptime'] =  $bestLap;
			$this->status['totaltime'] =  $totaltime;
			$this->status['laptime'] =  $laptime;
            if( isset($starttotal) ) {
                $this->status['starttotal'] = $starttotal;
            }
		} else {
			unset($this->status['activity']);
		}
	}

	/**
	 * csv2laps reads laps from csv file from mylaps server]
	 * @param  [string] $activity id of activity
	 * @return [array]  list of laps
	 */
	protected function csv2laps($activity) {
		$url = sprintf( 'http://www.mylaps.com/api/practiceactivity?activityID=%s&output=csv', $activity);
		$laps = array();
		$fi = fopen($url,'rb');
		if( $keys = fgetcsv($fi)) {
			$dummy = fgetcsv($fi);
			while($line = fgets($fi)) {
				if( $items = str_getcsv($line)) {
					$laps[] = array_combine($keys, $items);
				} else {
					$laps[] = [];
				}
			}
		}
		return $laps;
	}

	function str2ms($str) {
		$parts = explode(':', $str);
		$result = 0;
		while(count($parts) > 0 ) {
			$result = 60*$result + array_shift($parts);
		}
		return round(1000*$result);
	}

}