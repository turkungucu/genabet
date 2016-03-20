var c = angular.module('components', []);

c.directive('datePicker', function() {
    return {
        restrict: 'A,E',
        link: function(scope, element, attrs, controller) {
            element.datepicker();
        }
    };
});

c.directive('dropzone', function() {
    return {
        restrict: 'A,E',
        scope: {
            sid: '='
        },
        link: function(scope, element, attrs, controller) {
            scope.$watch('sid', function() {
                if (scope.sid) {
                    // TODO: Tie this to a real url later
                    var url = "/samples/" + scope.sid + '/files/new';
                    element.dropzone({
                        url: url,
                        init: function() {
                            this.on("addedfile", function(file) {
                                scope.$parent.addFile(file.name);
                            });
                        }
                    });
                }
            });
        }
    };
})

c.directive('patientTable', function() {
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
                            data: 'firstName',
                            defaultContent: ''
                        }, {
                            data: 'lastName',
                            defaultContent: ''
                        }, {
                            data: 'birthDate',
                            defaultContent: ''
                        }, {
                            data: 'diagnosis',
                            defaultContent: ''
                        }, {
                            data: 'diagnosisDate',
                            defaultContent: ''
                        }, {
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                var detailsLink = '<a href="#/patients/' + data + '" class="btn btn-success waves-effect waves-light btn-xs m-b-5"><i class="fa fa-search"></i> Details</a>';
                                return detailsLink;
                            }
                        }]
                    });
                }
            });
        }
    };
});

c.directive('sampleTable', function() {
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
                        order: [
                            [3, "desc"]
                        ],
                        columns: [{
                            data: 'name',
                            defaultContent: '',
                            render: function(data, type, row, meta) {
                                return '<a href="#/patients/' + row.patientId + '/samples/' + row.id + '">' + data + '</i></a>';
                            }
                        }, {
                            data: 'details',
                            defaultContent: ''
                        }, {
                            data: 'status',
                            defaultContent: '',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                var status = row.status;
                                var labelClass = 'label-primary';
                                var spinner = '<i class="fa fa-circle-o-notch fa-spin"></i> ';

                                if ('CREATED' === status) {
                                    labelClass = 'label-warning';
                                } else if ('READY' === status) {
                                    labelClass = 'label-primary';
                                } else if ('PROCESSING' == status) {
                                    labelClass = 'label-purple';
                                } else if ('KILLED' == status) {
                                    labelClass = 'label-danger';
                                    data = 'CANCELLED'
                                }

                                if ('PROCESSING' === status) {
                                    return '<span class="label ' + labelClass + '">' + spinner + '&nbsp;' + data + '</span>';
                                } else {
                                    return '<span class="label ' + labelClass + '">' + data + '</span>';
                                }
                            }
                        }, {
                            data: 'dateCreated',
                            render: function(data, type, row, meta) {
                                if (type == 'sort') return data;
                                return data ? moment(data).fromNow() : '';
                            }
                        }, {
                            data: 'processingStartTs',
                            render: function(data, type, row, meta) {
                                if (type == 'sort') return data ? data : '';
                                return data ? moment(data).fromNow() : '';
                            }
                        }, {
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                var status = row.status;
                                if ('READY' === status) {
                                    resultsLink = '<a href="#/samples/' + data + '/results" class="btn btn-success waves-effect waves-light btn-xs m-b-5"><i class="fa fa-flask"></i> Results</i></a>';
                                    return resultsLink;
                                } else {
                                    return '';
                                }
                            }
                        }]
                    });
                }
            });
        }
    };
});

c.directive('mutationsTable', function() {
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
                        order: [
                            [0, "asc"]
                        ],
                        columns: [{
                            data: 'gene',
                            defaultContent: ''
                        }, {
                            data: 'cdsChange',
                            defaultContent: ''
                        }, {
                            data: 'aaChange',
                            defaultContent: ''
                        }, {
                            data: 'type',
                            defaultContent: ''
                        }, {
                            data: 'effect',
                            defaultContent: ''
                        }, {
                            data: 'tissues',
                            render: function(data, type, row, meta) {
                                var result = '';
                                if (data) {
                                    data.forEach(function(tissue) {
                                        result += '- ' + tissue + '<br/>';
                                    });
                                }
                                return result;
                            }
                        }, {
                            data: 'quality',
                            defaultContent: ''
                        }, {
                            data: 'readDepth',
                            defaultContent: ''
                        }, {
                            data: 'numCopiesPerMl',
                            defaultContent: ''
                        }, {
                            data: 'cosmicId',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                if (data) {
                                    return '<a href="http://cancer.sanger.ac.uk/cosmic/mutation/overview?id=' + data + '" target="_blank">' + data + '</a>';
                                } else {
                                    return '';
                                }
                            }
                        }]
                    });
                }
            });
        }
    };
});

c.directive('donutChart', function() {
    return {
        restrict: 'A,E',
        scope: {
            data: '='
        },
        link: function(scope, element, attrs, controller) {
            scope.$watch('data', function() {
                if (scope.data) {
                    Morris.Donut({
                        element: element,
                        data: scope.data,
                        colors: ["#00b19d", "#ededed", "#64b5f6", "#F0F8FF", "#FAEBD7", "#8A2BE2",
                            "#DC143C", "#FF8C00", "#FF1493", "#FFB6C1", "#F5FFFA", "#000080"
                        ]
                    });
                }
            });
        }
    };
});

c.directive('progressChart', function() {
    return {
        restrict: 'A,E',
        scope: {
            data: '='
        },
        link: function(scope, element, attrs, controller) {
            scope.$watch('data', function() {
                if (scope.data) {
                    function drawChart() {
                        var data = google.visualization.arrayToDataTable(scope.data);

                        var options = {
                            title: 'Plasma Mutation Levels over Time',
                            hAxis: {
                                title: 'Month',
                                titleTextStyle: {
                                    color: '#333'
                                }
                            },
                            vAxis: {
                                title: 'Mutation copies/mL',
                                minValue: 0
                            },
                            series: {
                                0: {
                                    areaOpacity: 0.0
                                }
                            },
                            width: 900,
                            height: 500
                        };

                        var chart = new google.visualization.AreaChart(element[0]);
                        chart.draw(data, options);
                    }

                    google.charts.setOnLoadCallback(drawChart);
                }
            });
        }
    };
});

c.filter('toHumanDate', function() {
    return function(dateStr) {
        return dateStr != null ? moment(dateStr).fromNow() : "";
    };
});