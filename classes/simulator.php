<?php
require_once ('classes/iLaps.php');

class Simulator implements iLaps
{
    protected $par, $data, $filename;
    
    public function __construct($par) {
        $this->par = $par;
        if (preg_match('/^[\w\-]+$/', $par['transponderid'])) {
            $this->filename = $this->getFilename($par['transponderid']);
        } 
        else {
            $this->id = null;
        }
        $this->readData();
    }
    
    public function getStatus() {
        $this->readData();
        if (isset($_GET['test'])) {
            print_r($this->data);
        }
        $numlaps = count($this->data['laps']);
        if( $numlaps == 0 ) {
            return false;
        };
        $result = [];
        $result['numlaps'] = $numlaps;
        $result['bestlaptime'] = $this->data['bestLap'];
        $result['totaltime'] = $this->data['laps'][$numlaps - 1]['totalTime'];
        if( $this->data['active']) {
            $result['activity'] = 'sim';
            $result['laptime'] = $this->data['laps'][$numlaps - 1]['lapTime'];
            if( isset($this->par['numlaps']) && $numlaps > $this->par['numlaps'] ) {
                $result['starttotal'] = $this->data['laps'][$this->par['numlaps']]['totalTime'];
            }
        }
        return $result;
    }
    
    protected function getFilename($id) {
        return sprintf('data/%s.ser', $id);
    }
    
    protected function readData() {
        if (file_exists($this->filename)) {
            $this->data = unserialize(file_get_contents($this->filename));
            // Make inactive if more after one hour or more
            if( $this->time2ms(microtime(true)) - $this->data['lastTime'] > 3600000 ) {
                $this->data['active'] = false;
            }
        } 
        else {
            $this->data = ['active' => false, 'laps' => [], 'lastTime' => 0, 'reset' => true];
        }
    }
    
    protected function writeData() {
        file_put_contents($this->filename, serialize($this->data));
    }
    
    public function lap() {
        $this->readData();
        $now = $this->time2ms(microtime(true));
        if (!$this->data['active']) {
            $this->data['active'] = true;
            $this->data['laps'] = [];
        } 
        elseif ($this->data['lastTime'] > 0) {
            $lapTime = $now - $this->data['lastTime'];
            $numLaps = count($this->data['laps']);
            if ($numLaps == 0 || $lapTime < $this->data['bestLap']) {
                $this->data['bestLap'] = $lapTime;
            }
            $totalTime = $numLaps == 0 ? 0 : $this->data['laps'][$numLaps - 1]['totalTime'];
            $this->data['laps'][] = [
                'lapTime' => $lapTime, 
                'totalTime' => $totalTime + $lapTime];
        }
        $this->data['lastTime'] = $now;
        $this->writeData();
    }
    
    public function reset() {
        $this->readData();
        $this->data['active'] = false;
        $this->writeData();
    }
    
    protected function time2ms($time) {
        return round(1000 * $time);
    }

    public function getData() {
        return $this->data;
    }
   
}
