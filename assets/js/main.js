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
    }).when('/patients/:pid/sample/new', {
        controller: 'SampleCtrl',
        templateUrl: 'sample.html'
    }).when('/patients/:pid/sample/:sid', {
        controller: 'SampleCtrl',
        templateUrl: 'sample.html'
    }).when('/patients/:pid/samples', {
        controller: 'SampleListCtrl',
        templateUrl: 'sampleList.html'
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

app.factory('SampleCrudProvider', ['fbRef', '$q', function(fbRef, $q) {
    return {
        get: function(patientId) {
            return new FirebaseCrud(fbRef.child('/patients/' + patientId + '/samples'), $q);
        }
    };
}]);

app.controller('PatientListCtrl', function($scope, $location, Patients) {
    Patients.list(function() {
        $scope.loading = true;
    }).then(function(patients) {
        $scope.patients = patients;
        $scope.loading = false;
    });
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

    $scope.removePatient = function() {
        var ok = confirm('Are you sure to remove this patient?');
        if (ok) {
            Patients.remove($scope.patient.id).then($location.path('/patients'));
        }
    };

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

app.controller('SampleCtrl', function($scope, $routeParams, $location, $q, fbRef, Patients, SampleCrudProvider) {
    var patientId = $routeParams.pid;
    if (patientId) {
        Patients.get(patientId).then(function(patient) {
            $scope.patient = patient;
        });
    }

    $scope.step = 1;
    $scope.saveSample = function() {
        var sample = {
            name: this.sample.name,
            details: this.sample.details
        };
        var pid = $scope.patient.id;
        SampleCrudProvider.get(pid).save(sample).then(function(result) {
            $scope.step = 2;
            $scope.$apply();
        });
    };
});

app.directive('dropzone', function() {
    return {
        restrict: 'A,E',
        link: function(scope, element, attrs, controller) {
            element.dropzone({
                url: "/file/post",
            });
        }
    };
})

app.directive('datatable', function() {
    return {
        restrict: 'A,E',
        scope: {
            rows: '='
        },
        link: function(scope, element, attrs, controller) {
            scope.$watch('rows', function() {
                if (scope.rows) {
                    element.DataTable({
                        data: scope.rows,
                        columns: [{
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                return '<a href="#/patients/' + data + '"><i class="fa fa-pencil-square-o"></i></a>';
                            }
                        }, {
                            data: 'firstName',
                            defaultContent: ''
                        }, {
                            data: 'lastName',
                            defaultContent: ''
                        }, {
                            data: 'birthDate',
                            defaultContent: ''
                        }, {
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                return '<a href="#/patients/' + data + '/sample/new">Add sample</i></a>';
                            }
                        }]
                    });
                }
            });
        }
    };
});