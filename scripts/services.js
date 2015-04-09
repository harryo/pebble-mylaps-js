'use strict';
angular.module('myApp').
factory('trackSimulationService', function($q, $http, $window) {
    var serviceInstance = {
        active: false,
        reset: reset,
        lap: lap,
        getData: getData,
        currentLap: currentLap,
        data: undefined
    }, lapStart, lapTime = 0;

    function ajax(id, action) {
        var deferred = $q.defer(),
            url = '/simulation.php?transponderid=' + id;
        if (action !== undefined) {
            url += '&action=' + action;
        }
        $http.get(url).
        success(function(data) {
            deferred.resolve(data);
        });
        return deferred.promise;
    }

    function reset(id) {
        var promise = ajax(id, 'reset');
        serviceInstance.active = false;
        return promise;
    }

    function currentLap() {
        if (serviceInstance.active) {
            lapTime = now() - lapStart;
        }
        return lapTime;
    }

    function lap(id) {
        var promise = ajax(id,'lap');
        serviceInstance.active = true;
        lapStart = now();
        return promise;
    }

    function getData(id) {
        return ajax(id);
    }

    return serviceInstance;
}).
factory('pebbleService', function() {
    var serviceInstance = {
        viewNames: ['bestlap', 'laptime', 'numlaps', 'count'],
        views: [],
        vibe: ''
    };
    serviceInstance.viewNames.forEach(function(item) {
        serviceInstance.views[item] = {
            header: item.toUpperCase(),
            body: ''
        };
    });
    return serviceInstance;
}).
factory('configService', function($cookies) {
    var year_ms = 365 * 24 * 3600 * 1000,
        serviceInstance = {
            data: {
                transponderid: '',
                trackid: ''
            },
            save: function() {
                $cookies.putObject('myLapsConfig', serviceInstance.data, {
                    expire: new Date(Date.now + year_ms)
                });
            }
        };
    var data = $cookies.getObject('myLapsConfig');
    if (data) {
        serviceInstance.data = data;
    }
    return serviceInstance;
});