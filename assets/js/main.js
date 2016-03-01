// TODO: Put this in a separate module
function FirebaseCrud(baseRef, q) {
    this.q = q;
    this.baseRef = baseRef;

    function idRef(id) {
        return baseRef.child('/' + id);
    };

    function copyWoId(obj) {
        var copy = {};
        for (var key in obj) {
            if ('id' !== key) {
                copy[key] = obj[key];
            }
        }
        return copy;
    }

    this.save = function(obj) {
        var p = copyWoId(obj);
        if (obj.id) {
            return idRef(obj.id).update(p);
        } else {
            return baseRef.push(p);
        }
    };

    this.remove = function(id) {
        return idRef(id).remove();
    };

    this.list = function(beforeFn) {
        if (beforeFn) beforeFn();

        var deferred = q.defer();
        baseRef.once('value', function(result) {
            var list = [];
            result.forEach(function(child) {
                var obj = child.val();
                obj.id = child.key();
                list.push(obj);
            });
            deferred.resolve(list);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };

    this.get = function(id) {
        var deferred = q.defer();
        idRef(id).once('value', function(result) {
            var obj = result.val();
            obj.id = result.key();
            deferred.resolve(obj);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };
}

var app = angular.module('main', ['ngRoute']);

app.config(function($routeProvider) {
    $routeProvider.when('/', {
        controller: 'HomeCtrl',
        templateUrl: 'home.html'
    }).when('/patients', {
        controller: 'PatientListCtrl',
        templateUrl: 'patientList.html'
    }).when('/patients/new', {
        controller: 'PatientCtrl',
        templateUrl: 'patient.html'
    }).when('/patients/:id', {
        controller: 'PatientCtrl',
        templateUrl: 'patient.html'
    }).when('/reports', {
        controller: 'ReportsCtrl',
        templateUrl: 'reports.html'
    }).otherwise({
        redirectTo: '/'
    });
});

app.value('fbUrl', 'https://dazzling-heat-3989.firebaseio.com');

app.service('fbRef', function(fbUrl) {
    return new Firebase(fbUrl);
});

app.service('Patients', ['fbRef', '$q', function(fbRef, $q) {
    return new FirebaseCrud(fbRef.child('/patients'), $q);
}]);

app.controller('PatientListCtrl', function($scope, $location, Patients) {
    $scope.removePatient = function(id) {
        var ok = confirm('Are you sure to remove this patient?');
        if (ok) {
            Patients.remove(id).then(setPatients());
        }
    };

    function setPatients() {
        Patients.list(function() {
            $scope.loading = true;
        }).then(function(patients) {
            $scope.patients = patients;
            $scope.loading = false;
        });
    }

    setPatients();
});

app.controller('PatientCtrl', function($scope, $location, $routeParams, Patients) {
    $scope.savePatient = function() {
        var patient = {
            firstName: this.patient.firstName,
            lastName: this.patient.lastName
        };
        var bd = this.patient.birthDate;
        if (bd) {
            patient.birthDate = bd;
        }
        if ($scope.patient) {
            patient.id = $scope.patient.id;
        }
        Patients.save(patient).then($location.path('/patients'));
    }

    var patientId = $routeParams.id;
    if (patientId) {
        Patients.get(patientId).then(function(patient) {
            $scope.patient = patient;
        });
    }
});

app.controller('HomeCtrl', function($scope) {

});

app.controller('ReportsCtrl', function($scope) {
	// TODO: Implement
    $scope.reports = [{
        name: 'My first report',
        ts: '2 days ago'
    }, {
        name: 'My 2nd report',
        ts: '1 month ago'
    }];
});