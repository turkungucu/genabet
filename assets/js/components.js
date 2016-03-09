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
        link: function(scope, element, attrs, controller) {
            element.dropzone({
                url: "/file/post",
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
                            data: 'dateCreated',
                            render: function(data, type, row, meta) {
                                return data ? moment(data).fromNow() : '';
                            }
                        }, {
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                addLink = '<a href="#/patients/' + data + '/samples/new" class="btn btn-purple waves-effect waves-light btn-xs m-b-5"><i class="glyphicon glyphicon-plus"></i> Sample</i></a>';
                                editLink = '<a href="#/patients/' + data + '" class="btn btn-primary waves-effect waves-light btn-xs m-b-5"><i class="glyphicon glyphicon-pencil"></i> Edit</i></a>';
                                return addLink + '&nbsp;' + editLink;
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
                            [0, "desc"]
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
                                    labelClass = 'label-success'; 
                                } else if ('PROCESSING' == status) {
                                    labelClass = 'label-purple'; 
                                }

                                if ('PROCESSING' === status) {
                                    return '<span class="label ' + labelClass + '">' + spinner + '&nbsp;' + data + '</span>';
                                } else {
                                    return '<span class="label ' + labelClass +'">' + data + '</span>';
                                }
                            }
                        }, {
                            data: 'dateCreated',
                            render: function(data, type, row, meta) {
                                return data ? moment(data).fromNow() : '';
                            }
                        }, {
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                var status = row.status;
                                if ('READY' === status) {
                                    resultsLink = '<a href="#/samples/' + data + '/results" class="btn btn-primary waves-effect waves-light btn-xs m-b-5"><i class="glyphicon glyphicon-search"></i> Results</i></a>';                                   
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
                            data: 'alleleFrequency',
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
            		           "#DC143C", "#FF8C00", "#FF1493", "#FFB6C1", "#F5FFFA", "#000080"]
            		});
                }
            });
        }
    };
});