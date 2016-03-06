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
    }).when('/samples/:id/results', {
        controller: 'ResultsCtrl',
        templateUrl: 'results.html'
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
        	sample.patientId = patient.id;
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

    var sampleId = $routeParams.sid;
    if (sampleId) {
    	Samples.get(sampleId).then(function(sample) {
    		$scope.sample = sample;
    	});
    }
    
    function checkExistingSample(sampleName, successFn) {
    	var existingSamples = $scope.patient.samples;
        var sampleExists = existingSamples && existingSamples.some(function(s) {
            return s.name === sampleName;
        });

        if (sampleExists) {
            $scope.errorMessage = 'Sample with name ' + sampleName + ' already exists for this patient';
        } else {
        	successFn(); 
        }
    }
    
    $scope.saveSample = function(){
        $scope.errorMessage = '';

        var sampleName = this.sample.name;
        var sample = {
            name: sampleName,
            details: this.sample.details
        };

        if ($scope.sample.id) {
            sample.id = $scope.sample.id;
            // TODO: Check for existing samples
            Samples.save(sample).then($location.path('/samples'));
        } else {
        	checkExistingSample(sampleName, function () {
        		sample.status = 'CREATED';
            	Samples.saveUnderPatient(sample, $scope.patient).then($location.path('/samples'));
        	});
        }
    };
    
    $scope.analyzeSample = function() {
    	$scope.sample.status = 'PROCESSING';
    	Samples.save($scope.sample).then($location.path('/samples'));
    }
});

app.controller('ResultsCtrl', function($scope, $routeParams, $location, $q, fbRef, Patients, Samples) {
	var mutations = [{
		gene: 'KRAS',
		rep: 'c.34G>C',
		type: 'Substitution - Missense',
		aaChange: 'G12R',
		effect: 'Codon change',
		tissues: ['Pancreas', 'Large intestine', 'Lung', 'Billary tract', 'Ovary'],
		quality: 100,
		readDepth: 1000,
		alleleFrequency: 0.001,
		cosmicId: 518
	}, {
		gene: 'EGFR',
		rep: 'c.2369C>T',
		type: 'Substitution - Missense',
		aaChange: 'T790M',
		effect: 'Codon change',
		tissues: ['Lung', 'Breast', 'Upper aerodigestive tract', 'Billary tract', 'Central nervous system'],
		quality: 250,
		readDepth: 1052,
		alleleFrequency: 0.001,
		cosmicId: 6240
	}, {
		gene: 'EGFR',
		rep: 'c.2290_2291ins12',
		type: 'Insertion',
		aaChange: 'p.A763_Y764insFQEA',
		effect: 'Codon insertion',
		tissues: ['Lung'],
		quality: 230,
		readDepth: 1122,
		alleleFrequency: 0.002,
		cosmicId: 26720
	}, {
		gene: 'EGFR',
		rep: 'c.1138delT',
		type: 'Deletion',
		aaChange: 'p.S380fs*16',
		effect: 'Frame shift',
		tissues: ['Ovary'],
		quality: 230,
		readDepth: 1310,
		alleleFrequency: 0.003,
		cosmicId: 111519
	}, {
		gene: 'BRAF',
		rep: 'c.1415A>G',
		type: 'Substitution - Missense',
		aaChange: 'Y472C',
		effect: 'Codon change',
		tissues: ['Lung', 'Large intestine'],
		quality: 220,
		readDepth: 1295,
		alleleFrequency: 0.001,
		cosmicId: 1133046
	}, {
		gene: 'PTEN',
		rep: 'c.697C>T',
		type: 'Substitution - Missense',
		aaChange: 'R233*',
		effect: 'Stop gained',
		tissues: ['Endometrium', 'Central nervous system', 'Large intestine', 'Cervix', 'Lung'],
		quality: 423,
		readDepth: 1125,
		alleleFrequency: 0.001,
		cosmicId: 5154
	}, {
		gene: 'FGFR1',
		rep: 'c.578_579insA',
		type: 'Insertion',
		aaChange: 'N193fs*8',
		effect: 'Frame shift',
		tissues: ['Large intestine'],
		quality: 122,
		readDepth: 1069,
		alleleFrequency: 0.001,
		cosmicId: 1456945
	}];
	
	function simulateResults() {
		
	}
	
    var sampleId = $routeParams.id;
    if (sampleId) {
    	Samples.get(sampleId).then(function(sample) {
    		$scope.sample = sample;
    		// Simulate sample results. TODO: Remove when backend is implemented
    		if (!$scope.sample.results) {
    			
    		}
    	});
    }
});