'use strict';

angular.module('myApp').directive('pebbleView', function(pebbleService) {
    return {
        restrict: 'A',
        scope: true,
        template: '<div><div class="header" ng-bind="view.header"></div><div class="body" ng-bind="view.body"></div></div>',
        link: function(scope, iElem, iAttrs) {
            scope.view = pebbleService.views[iAttrs.pebbleView];
        }
    };
}).directive('pebbleButton', function($rootScope, pebbleService) {
    return {
        restrict: 'A',
        link: function(scope, iElem, iAttrs) {
            var tDown = 0,
                tLongMin = 500;
            iElem.on('mousedown', function(event) {
                tDown = now();
            });
            iElem.on('mouseup', function(event) {
                var evName = (now() - tDown > tLongMin) ? 'longClick' : 'click';
                $rootScope.$broadcast(evName + '.' + iAttrs.pebbleButton);
            });
        }
    };
});