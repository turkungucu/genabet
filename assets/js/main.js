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
    /*$scope.patients = [{
    	firstName: 'Angelina',
    	lastName: 'Jolie',
    	birthDate: '1/1/1985'
    }];*/
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

app.directive('datatable', function () {
	return {
		restrict: 'A,E',
		scope: {
			rows: '='
		},
		link: function (scope, element, attrs, controller) {
			scope.$watch('rows', function () {
				if (scope.rows) {
					element.DataTable({
					    data: scope.rows,
					    columns: [{ data: 'firstName' }, { data: 'lastName' }, { data: 'birthDate', defaultContent: '' }]
					}); 
				}
			});		
		}
	}
});