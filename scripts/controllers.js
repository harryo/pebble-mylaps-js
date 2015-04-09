'use strict';
angular.module('myApp').
controller('configController', function($scope, $window, configService) {
    $scope.config = configService.data;
    $window.config = $scope.config;
    $scope.$watch('config', function() {
        configService.save();
        $window.fetcher.params = {};
        $window.fetcher.reFetch();
    }, true);
}).
controller('trackSimulationController', function($scope, $window, trackSimulationService) {
    $scope.data = {};
    $scope.format = $window.formatTime;
    $scope.reset = function() {
        trackSimulationService.reset($window.config.transponderid).
        then(function(data) {
            $scope.data = data;
        });
    };
    $scope.lap = function() {
        trackSimulationService.lap($window.config.transponderid).
        then(function(data) {
            $scope.data = data;
        });
    };
    $scope.thislap = formatTime(0, 1);
    trackSimulationService.getData($window.config.transponderid).
    then(function(data) {
        $scope.data = data;
    });
    setInterval(function() {
        $scope.$apply(function() {
            $scope.thislap = formatTime(trackSimulationService.currentLap(), 1);
        });
    }, 100);
    // $window.updater['trackSimulation'] = trackSimulationService.ajax;
}).
controller('pebbleController', function($scope, $window, $rootScope, $timeout, pebbleService) {
    $scope.pebble = pebbleService;
    $scope.vibes = true;
    var timeout;
    var vibes = {
        short: new buzz.sound("/sounds/short.ogg"),
        long: new buzz.sound("/sounds/long.ogg"),
        double: new buzz.sound("/sounds/double.ogg"),
    };
    // $scope.pebble.views.bestlap.body = 'Welcome!';
    $window.ngDevice.on = function(name, button, handler) {
        $rootScope.$on(name + '.' + button, handler);
    };
    $window.ngDevice.setText = function(view, text) {
        $timeout(function() {
            $scope.pebble.views[view].body = text;
        });
    };
    $window.ngDevice.setHeader = function(view, text) {
        $timeout(function() {
            $scope.pebble.views[view].header = text;
        });
    };
    $window.ngDevice.vibrate = function(type) {
        if ($scope.vibes) {
            vibes[type].play();
        }
    }
});