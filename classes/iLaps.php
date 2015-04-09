<?php

/**
 * iLaps defines the interface of getting status information from MyLaps or a simulator
 */

interface iLaps {
    
    /**
     * __construct creates new iLaps, $par is
     * @param [array] par parameters, associative array:
     *   [string] transponderid id of transponder
     *   [int] trackid       	id of track (ignored for simulator)
     *   [int] numlaps     		number of laps counted already (optional)
     *   [string] activityid	id of ongoing activity (optional, ignored for simulator)
     */
    public function __construct($par);
    
    /**
     * getStatus return the status information, or false if no status available
     * @return [array] status  associative array
     *   [int] numlaps			number of laps in last activity
     *   [int] bestlaptime		best lap time in last activity, in milliseconds
     *   [int] totaltime		total time of last activity
     *  If there is an ongoing activity, also:
     *   [string] activity		id of ongoing activity
     *   [int] laptime			lap time of last lap, in milliseconds
     *   [int] starttotal		total time after first passing after $oldlaps (useful for timing series)
     */
    public function getStatus();
}
