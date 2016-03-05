var app = angular.module('main', ['ngRoute', 'components']);

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
    }).when('/patients/:pid/samples/new', {
        controller: 'SampleCtrl',
        templateUrl: 'sample.html'
    }).when('/patients/:pid/samples/:sid', {
        controller: 'SampleCtrl',
        templateUrl: 'sample.html'
    }).when('/patients/:pid/samples', {
        controller: 'SampleListCtrl',
        templateUrl: 'sampleList.html'
    }).when('/samples', {
        controller: 'SampleListCtrl',
        templateUrl: 'sampleList.html'
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

app.service('Samples', ['fbRef', '$q', 'Patients', function(fbRef, $q, Patients) {
    var s = new FirebaseCrud(fbRef.child('/samples'), $q);
    return {
        list: function() {
            return s.list();
        },
        get: function(id) {
            return s.get(id);
        },
        save: function(sample) {
            return s.save(sample);
        },
        // Save the samples separately
        // Add their id,name pairs to the patient for fast lookup later
        saveUnderPatient: function(sample, patient) {
            var response = s.save(sample);
            var sampleId = response.key();
            response.then(function() {
                if (!patient.samples) {
                    patient.samples = [];
                }
                patient.samples.push({
                    id: sampleId,
                    name: sample.name
                });
                Patients.save(patient);
            });
            return response;
        },
        remove: function(id) {
            return s.remove(id);
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
            lastName: this.patient.lastName,
            birthDate: this.patient.birthDate,
            diagnosis: this.patient.diagnosis
        };
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

app.controller('SampleListCtrl', function($scope, $location, Samples) {
    Samples.list(function() {
        $scope.loading = true;
    }).then(function(samples) {
        $scope.samples = samples;
        $scope.loading = false;
    });
});

app.controller('SampleCtrl', function($scope, $routeParams, $location, $q, fbRef, Patients, Samples) {
    var patientId = $routeParams.pid;
    if (patientId) {
        Patients.get(patientId).then(function(patient) {
            $scope.patient = patient;
        });
    }

    $scope.step = 1;
    $scope.createSample = function() {
        $scope.errorMessage = '';

        // Check to see if there is another sample with this name under this patient
        var existingSamples = $scope.patient.samples;
        var sampleName = this.sample.name;
        var sampleExists = existingSamples && existingSamples.some(function(s) {
            return s.name === sampleName;
        });

        if (sampleExists) {
            $scope.errorMessage = 'Sample with name ' + sampleName + ' already exists for this patient';
        } else {
            var sample = {
                name: sampleName,
                details: this.sample.details,
                status: 'CREATED'
            };

            Samples.saveUnderPatient(sample, $scope.patient).then(function(result) {
                $scope.sample.id = result.key();
                $scope.step = 2;
                $scope.$apply();
            });
        }
    };

    $scope.submitForAnalysis = function() {
        $scope.sample.status = 'PROCESSING';
        Samples.save($scope.sample).then($location.path('/samples'));
    };
});