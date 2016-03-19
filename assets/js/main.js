var app = angular.module('main', ['ngRoute', 'components']);

app.config(function($routeProvider) {
    $routeProvider.when('/', {
        controller: 'PatientListCtrl',
        templateUrl: 'patientList.html'
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
    var progdef = function(patientId) {
        return fbRef.child('/patients/' + patientId + '/progressData');
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
        },
        addProgressData: function(patientId, progressData) {
            return progdef(patientId).set(progressData);
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
                    name: sample.name,
                    extractionDate: sample.extractionDate
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
    // Mock progress data
    var progressData = [
        [
            ['Mutation Level', 'BRAF V600E', 'Dabrafenib', 'Ipilimumab'],
            ['1', 1000, undefined, undefined],
            ['2', 1050, undefined, undefined],
            ['3', 900, 1200, undefined],
            ['4', 800, 1200, undefined],
            ['5', 750, 1200, undefined],
            ['6', 800, 1200, undefined],
            ['7', 900, 1200, undefined],
            ['8', 1000, undefined, undefined],
            ['9', 850, undefined, 1200],
            ['10', 500, undefined, 1200],
            ['11', 200, undefined, 1200],
            ['12', 100, undefined, 1200]
        ],
        [
            ['Mutation Level', 'EGFR 790M', 'Osimertinib'],
            ['1', 200, undefined],
            ['2', 250, undefined],
            ['3', 180, 300],
            ['4', 150, 300],
            ['5', 110, 300],
            ['6', 95, 300],
            ['7', 80, 300],
            ['8', 70, 300],
            ['9', 65, 300],
            ['10', 50, undefined],
            ['11', 40, undefined],
            ['12', 35, undefined]
        ],
        [
            ['Mutation Level', 'KRAS G12D', 'Bevacizumab', 'Everolimus'],
            ['1', 100, undefined, undefined],
            ['2', 200, undefined, undefined],
            ['3', 300, 1200, undefined],
            ['4', 250, 1200, undefined],
            ['5', 330, 1200, undefined],
            ['6', 500, 1200, undefined],
            ['7', 650, undefined, undefined],
            ['8', 700, undefined, 1200],
            ['9', 720, undefined, 1200],
            ['10', 850, undefined, 1200],
            ['11', 900, undefined, 1200],
            ['12', 980, undefined, undefined]
        ],
        [
            ['Mutation Level', 'NRAS Q61H', 'Ipilimumab'],
            ['1', 2000, 2200],
            ['2', 1800, 2200],
            ['3', 400, 2200],
            ['4', 200, 2200],
            ['5', 100, 2200],
            ['6', 80, 2200],
            ['7', 75, undefined],
            ['8', 60, undefined]
        ]
    ];

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var step = $location.search()['step'];
    $scope.step = step ? parseInt(step) : 1;
    var patientId = $routeParams.id;
    if (patientId) {
        Patients.get(patientId).then(function(patient) {
            $scope.patient = patient;
            if (patient.samples) {
                $scope.analyzedSamples = [];
                $scope.samples = patient.samples.reduce(function(res, sample) {
                    Samples.get(sample.id).then(function(sample) {
                        res.push(sample);
                        if ('READY' === sample.status) $scope.analyzedSamples.push(sample);
                    });
                    return res;
                }, []);
            }

            $scope.patient.treatments = Patients.getTreatments(patient);;

            // Generate and save mock progress data
            if (!$scope.patient.progressData) {
                var randProgData = progressData[randInt(0, progressData.length - 1)];
                // Can't store undefined values in Firebase, so replace them with -1
                var fbRandProgData = randProgData.map(function(data) {
                    return data.map(function(value) {
                        return value ? value : -1;
                    });
                });
                $scope.patient.progressData = randProgData;
                Patients.addProgressData(patientId, fbRandProgData);
            } else {
                // Replace the -1s with undefined so that Google Charts works
                var progData = $scope.patient.progressData.map(function(data) {
                    return data.map(function(value) {
                        return value === -1 ? undefined : value;
                    })
                });
                $scope.patient.progressData = progData;
            }

            // History events
            var historyEvents = [];
            historyEvents.push({
                title: 'Diagnosed with ' + patient.diagnosis,
                ts: patient.diagnosisDate,
                type: 'DIAGNOSIS'
            });
            var ptrs = patient.treatments;
            Object.keys(ptrs).forEach(function(trid) {
                var treatment = ptrs[trid];
                historyEvents.push({
                    title: 'Started using ' + treatment.drug,
                    ts: treatment.startDate,
                    type: 'TREATMENT'
                });
                if (treatment.stopDate) {
                    historyEvents.push({
                        title: 'Stopped using ' + treatment.drug,
                        ts: treatment.stopDate,
                        type: 'TREATMENT'
                    });
                }
            });
            var ss = patient.samples;
            Object.keys(ss).forEach(function(sid) {
                var sample = ss[sid];
                historyEvents.push({
                    title: 'Sample ' + sample.name + " extracted",
                    ts: sample.extractionDate,
                    type: 'SAMPLE'
                });
            });
            historyEvents.sort(function(first, second) {
                return Date.parse(first.ts) - Date.parse(second.ts);
            });
            $scope.historyEvents = historyEvents;
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
        var now = Date.now();
        var birthDate = this.patient.birthDate;
        if (Date.parse(birthDate) > now) {
            $scope.errorMessage = 'Birthday cannot in the future';
            return;
        }

        var diagnosisDate = this.patient.diagnosisDate;
        if (Date.parse(diagnosisDate) > now) {
            $scope.errorMessage = 'Diagnosis date cannot in the future';
            return;
        }

        var patient = {
            firstName: this.patient.firstName,
            lastName: this.patient.lastName,
            birthDate: this.patient.birthDate,
            diagnosis: this.patient.diagnosis,
            diagnosisDate: diagnosisDate
        };
        if ($scope.patient) {
            patient.id = $scope.patient.id;
        }
        Patients.save(patient).then($location.path('/patients/' + patient.id).search('step', '5'));
    }

    $scope.removePatient = function() {
        var ok = confirm('Are you sure to remove this patient?');
        if (ok) {
            Patients.remove($scope.patient.id).then($location.path('/patients'));
        }
    };
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
    var step = $location.search()['step'];
    $scope.step = step ? parseInt(step) : 1;
    
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

        var extDate = this.sample.extractionDate;
        if (Date.parse(extDate) > Date.now()) {
            $scope.errorMessage = 'Extraction date cannot in the future';
            return;
        }

        var sampleName = this.sample.name;
        var details = this.sample.details;
        var sample = {
            name: sampleName,
            extractionDate: extDate
        };
        if (details) {
            sample.details = details;
        }

        var redirectLink = '/patients/' + patientId;
        if ($scope.sample.id) {
            sample.id = $scope.sample.id;
            redirectLink += '/samples/' + sample.id
            // TODO: Check for existing samples
            Samples.save(sample).then($location.path(redirectLink).search('step', '2'));
        } else {
            redirectLink += '/samples/new';
            checkExistingSample(sampleName, function() {
                sample.status = 'CREATED';
                Samples.saveUnderPatient(sample, $scope.patient).then($location.path(redirectLink).search('step', '2'));
            });
        }
    };

    $scope.analyzeSample = function() {
        $scope.sample.status = 'PROCESSING';
        Samples.save($scope.sample);
    }
    
    $scope.cancelAnalysis = function() {
    	$scope.sample.status = 'KILLED';
        Samples.save($scope.sample);
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
                startDate: startDate
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
            } catch (err) {
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
        cosmicId: 518
    }, {
        gene: 'EGFR',
        cdsChange: 'c.2369C>T',
        aaChange: 'T790M',
        type: 'Substitution - Missense',
        effect: 'Codon change',
        tissues: ['Lung', 'Breast', 'Upper aerodigestive tract', 'Billary tract', 'Central nervous system'],
        cosmicId: 6240
    }, {
        gene: 'EGFR',
        cdsChange: 'c.2290_2291ins12',
        aaChange: 'p.A763_Y764insFQEA',
        type: 'Insertion',
        effect: 'Codon insertion',
        tissues: ['Lung'],
        cosmicId: 26720
    }, {
        gene: 'EGFR',
        cdsChange: 'c.1138delT',
        aaChange: 'p.S380fs*16',
        type: 'Deletion',
        effect: 'Frame shift',
        tissues: ['Ovary'],
        cosmicId: 111519
    }, {
        gene: 'BRAF',
        cdsChange: 'c.1799T>A',
        aaChange: 'V600E',
        type: 'Substitution - Missense',
        effect: 'Codon change',
        tissues: ['Thyroid', 'Skin', 'Large intestine'],
        cosmicId: 476
    }, {
        gene: 'PTEN',
        cdsChange: 'c.697C>T',
        aaChange: 'R233*',
        type: 'Substitution - Missense',
        effect: 'Stop gained',
        tissues: ['Endometrium', 'Central nervous system', 'Large intestine', 'Cervix', 'Lung'],
        cosmicId: 5154
    }, {
        gene: 'FGFR1',
        cdsChange: 'c.578_579insA',
        aaChange: 'N193fs*8',
        type: 'Insertion',
        effect: 'Frame shift',
        tissues: ['Large intestine'],
        cosmicId: 1456945
    }, {
        gene: 'FGFR1',
        cdsChange: '',
        aaChange: '',
        type: 'Amplificitation',
        effect: '',
        tissues: ['Lung']
    }, {
        gene: 'DDR2',
        cdsChange: 'c.1734delT',
        aaChange: 'L579fs*17',
        type: 'Deletion',
        effect: 'Frame shift',
        tissues: ['Kidney'],
        cosmicId: 20753
    }, {
        gene: 'NRAS',
        cdsChange: 'c.183A>C',
        aaChange: 'Q61H',
        type: 'Substitution - Missense',
        effect: 'Codon change',
        tissues: ['Haematopoietic and lymphoid', 'Skin', 'Large intestine', 'Thyroid'],
        cosmicId: 586
    }];

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function simulateMutations() {
        var randMut = [];
        var start = randInt(0, 4);
        var end = randInt(5, 9);
        for (var i = start; i <= end; i++) {
            var mut = mutations[i];
            mut.numCopiesPerMl = randInt(100, 1200);
            mut.readDepth = randInt(900, 1200);
            mut.quality = randInt(30, 300);
            randMut.push(mut);
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