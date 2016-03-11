var app = angular.module('main', ['ngRoute', 'components']);

app.config(function($routeProvider) {
    $routeProvider.when('/', {
        controller: 'HomeCtrl',
        templateUrl: 'home.html'
    }).when('/patients', {
        controller: 'PatientListCtrl',
        templateUrl: 'patientList.html'
    }).when('/patients/new', {
        controller: 'SavePatientCtrl',
        templateUrl: 'savePatient.html'
    }).when('/patients/:id/edit', {
        controller: 'SavePatientCtrl',
        templateUrl: 'savePatient.html'
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
    }).when('/patients/:pid/treatments/new', {
        controller: 'TreatmentCtrl',
        templateUrl: 'treatment.html'
    }).when('/patients/:pid/treatments/:tid', {
        controller: 'TreatmentCtrl',
        templateUrl: 'treatment.html'
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
    var pref = new FirebaseCrud(fbRef.child('/patients'), $q);
    var tref = function(patientId) {
        return fbRef.child('/patients/' + patientId + '/treatments');
    }
    var tridef = function(patientId, treatmentId) {
        return fbRef.child('/patients/' + patientId + '/treatments/' + treatmentId);
    }

    return {
        list: function(beforeFn) {
            return pref.list(beforeFn);
        },
        get: function(id) {
            return pref.get(id);
        },
        save: function(patient) {
            return pref.save(patient);
        },
        remove: function(id) {
            return pref.remove(id);
        },
        addTreatment: function(patientId, treatment) {
            return tref(patientId).push(treatment);
        },
        updateTreatment: function(patientId, treatment) {
        	var treatmentId = treatment.id;
        	delete treatment.id;
            return tridef(patientId, treatmentId).set(treatment);
        },
        removeTreatment: function(patientId, treatmentId) {
            return tridef(patientId, treatmentId).remove();
        },
        getTreatments: function(patient) {
            if (patient.treatments) {
                return Object.keys(patient.treatments).reduce(function(res, treatmentId) {
                    var treatment = patient.treatments[treatmentId];
                    treatment.id = treatmentId;
                    res.push(treatment);
                    return res;
                }, []);
            } else {
                return [];
            }
        }
    };
}]);

app.service('Samples', ['fbRef', '$q', 'Patients', function(fbRef, $q, Patients) {
    var s = new FirebaseCrud(fbRef.child('/samples'), $q);
    return {
        list: function(beforeFn) {
            return s.list(beforeFn);
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

app.controller('PatientCtrl', function($scope, $location, $routeParams, Patients, Samples) {
	var step = $location.search()['step'];
	$scope.step = step ? parseInt(step) : 1;
    var patientId = $routeParams.id;
    if (patientId) {
        Patients.get(patientId).then(function(patient) {
            $scope.patient = patient;
            if (patient.samples) {
                $scope.samples = patient.samples.reduce(function(res, sample) {
                    Samples.get(sample.id).then(function(sample) {
                        res.push(sample);
                    });
                    return res;
                }, []);
            }
            $scope.patient.treatments = Patients.getTreatments(patient);
        });
    }
});

app.controller('SavePatientCtrl', function($scope, $location, $routeParams, Patients) {
    var patientId = $routeParams.id;
    if (patientId) {
        Patients.get(patientId).then(function(patient) {
            $scope.patient = patient;
        });
    }
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

    $scope.saveSample = function() {
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
            checkExistingSample(sampleName, function() {
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

app.controller('TreatmentCtrl', function($scope, $routeParams, $location, $q, fbRef, Patients) {
    var patientId = $routeParams.pid;
    var treatmentId = $routeParams.tid;
    if (patientId) {
        Patients.get(patientId).then(function(patient) {
            $scope.patient = patient;
            if (treatmentId) {
                var treatments = Patients.getTreatments(patient);
                $scope.treatment = treatments.find(function(t) {
                    return t.id === treatmentId;
                });
            }
        });
    }
    
    function validateDates(startDate, stopDate) {
    	var startInMillis = Date.parse(startDate);
        var now = Date.now();
        if (startInMillis > now) {
        	throw 'Start date cannot in the future';
        } 
        if (stopDate) {
        	var stopInMillis = Date.parse(stopDate);
        	if (stopInMillis >= now) {
        		throw 'Stop date cannot in the future'; 
        	} 
        	if (startInMillis > stopInMillis) {
        		throw 'Start date cannot be after the stop date'; 
        	}
        } 
    }

    $scope.saveTreatment = function() {
        $scope.errorMessage = '';

        if ($scope.patient) {
        	var startDate = this.treatment.startDate;
            var treatment = {
                drug: this.treatment.drug,
                startDate :startDate
            };
            var stopDate = this.treatment.stopDate;
            if (stopDate) {
            	treatment.stopDate = stopDate;
            }
            try {
            	validateDates(startDate, stopDate); 
            	var result;
                if ($scope.treatment.id) {
                	treatment.id = $scope.treatment.id;
                    result = Patients.updateTreatment($scope.patient.id, treatment);
                } else {
                    result = Patients.addTreatment($scope.patient.id, treatment);
                }
                result.then($location.path('/patients/' + $scope.patient.id).search('step', '2'));
            } catch(err) {
            	$scope.errorMessage = err;
            } 
        }
    };

    $scope.removeTreatment = function(treatmentId) {
        var ok = confirm('Are you sure to remove this treatment?');
        if (ok) {
            Patients.removeTreatment($scope.patient.id, treatmentId).then($location.path('/patients'));
        }
    };
});

app.controller('ResultsCtrl', function($scope, $routeParams, $location, $q, fbRef, Patients, Samples) {
    var mutations = [{
        gene: 'KRAS',
        cdsChange: 'c.34G>C',
        aaChange: 'G12R',
        type: 'Substitution - Missense',
        effect: 'Codon change',
        tissues: ['Pancreas', 'Large intestine', 'Lung', 'Billary tract', 'Ovary'],
        quality: 100,
        readDepth: 1000,
        alleleFrequency: 0.001,
        cosmicId: 518
    }, {
        gene: 'EGFR',
        cdsChange: 'c.2369C>T',
        aaChange: 'T790M',
        type: 'Substitution - Missense',
        effect: 'Codon change',
        tissues: ['Lung', 'Breast', 'Upper aerodigestive tract', 'Billary tract', 'Central nervous system'],
        quality: 250,
        readDepth: 1052,
        alleleFrequency: 0.001,
        cosmicId: 6240
    }, {
        gene: 'EGFR',
        cdsChange: 'c.2290_2291ins12',
        aaChange: 'p.A763_Y764insFQEA',
        type: 'Insertion',
        effect: 'Codon insertion',
        tissues: ['Lung'],
        quality: 230,
        readDepth: 1122,
        alleleFrequency: 0.002,
        cosmicId: 26720
    }, {
        gene: 'EGFR',
        cdsChange: 'c.1138delT',
        aaChange: 'p.S380fs*16',
        type: 'Deletion',
        effect: 'Frame shift',
        tissues: ['Ovary'],
        quality: 230,
        readDepth: 1310,
        alleleFrequency: 0.003,
        cosmicId: 111519
    }, {
        gene: 'BRAF',
        cdsChange: 'c.1415A>G',
        aaChange: 'Y472C',
        type: 'Substitution - Missense',
        effect: 'Codon change',
        tissues: ['Lung', 'Large intestine'],
        quality: 220,
        readDepth: 1295,
        alleleFrequency: 0.001,
        cosmicId: 1133046
    }, {
        gene: 'PTEN',
        cdsChange: 'c.697C>T',
        aaChange: 'R233*',
        type: 'Substitution - Missense',
        effect: 'Stop gained',
        tissues: ['Endometrium', 'Central nervous system', 'Large intestine', 'Cervix', 'Lung'],
        quality: 423,
        readDepth: 1125,
        alleleFrequency: 0.001,
        cosmicId: 5154
    }, {
        gene: 'FGFR1',
        cdsChange: 'c.578_579insA',
        aaChange: 'N193fs*8',
        type: 'Insertion',
        effect: 'Frame shift',
        tissues: ['Large intestine'],
        quality: 122,
        readDepth: 1069,
        alleleFrequency: 0.001,
        cosmicId: 1456945
    }, {
        gene: 'FGFR1',
        cdsChange: '',
        aaChange: '',
        type: 'Amplificitation',
        effect: '',
        tissues: ['Lung'],
        quality: 566,
        readDepth: 1278,
        alleleFrequency: 0.001
    }, {
        gene: 'DDR2',
        cdsChange: 'c.1734delT',
        aaChange: 'L579fs*17',
        type: 'Deletion',
        effect: 'Frame shift',
        tissues: ['Kidney'],
        quality: 612,
        readDepth: 998,
        alleleFrequency: 0.002,
        cosmicId: 20753
    }, {
        gene: 'MAP2K1',
        cdsChange: 'c.167A>C',
        aaChange: 'Q56P',
        type: 'Substitution - Missense',
        effect: 'Codon change',
        tissues: ['Stomach', 'Large intestine', 'Haematopoietic and lymphoid', 'Lung'],
        quality: 618,
        readDepth: 1323,
        alleleFrequency: 0.002,
        cosmicId: 1235481
    }];

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function simulateMutations() {
        var randMut = [];
        var start = randInt(0, 4);
        var end = randInt(5, 9);
        for (var i = start; i <= end; i++) {
            randMut.push(mutations[i]);
        }
        return randMut;
    }

    function aggregateMutationsByGene(mutations) {
        return mutations.reduce(function(res, mut) {
            var gene = mut.gene;
            if (gene in res) {
                res[gene]++;
            } else {
                res[gene] = 1;
            }
            return res;
        }, {});
    }

    function aggregateMutationsByTissue(mutations) {
        return mutations.reduce(function(res, mut) {
            var tissues = mut.tissues;
            tissues.forEach(function(tissue) {
                if (tissue in res) {
                    res[tissue]++;
                } else {
                    res[tissue] = 1;
                }
            });
            return res;
        }, {});
    }

    function toPieChartData(aggregates) {
        return Object.keys(aggregates).reduce(function(res, key) {
            res.push({
                label: key,
                value: aggregates[key]
            });
            return res;
        }, []);
    }

    var sampleId = $routeParams.id;
    if (sampleId) {
        Samples.get(sampleId).then(function(sample) {
            $scope.sample = sample;
            // Simulate sample results. TODO: Remove when backend is implemented
            if (!$scope.sample.mutations) {
                $scope.sample.mutations = simulateMutations();
                Samples.save($scope.sample);
            }
            var geneTotals = aggregateMutationsByGene($scope.sample.mutations);
            $scope.geneTotalsData = toPieChartData(geneTotals);
            var tissueTotals = aggregateMutationsByTissue($scope.sample.mutations);
            $scope.tissueTotalsData = toPieChartData(tissueTotals);
        });
    }
});