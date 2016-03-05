var c = angular.module('components', []);

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
                            data: 'diagnosis',
                            defaultContent: ''
                        }, {
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                return '<a href="#/patients/' + data + '/samples/new">Add sample</i></a>';
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
                                if ('PROCESSING' === status) {
                                    return '<i class="fa fa-circle-o-notch fa-spin fa-2x"></i> ' + data;
                                } else {
                                    return data;
                                }
                            }
                        }, {
                            data: 'dateCreated',
                            defaultContent: ''
                        }, {
                            data: 'id',
                            orderable: false,
                            render: function(data, type, row, meta) {
                                var status = row.status;
                                if ('READY' === status) {
                                    return '<a href="#/samples/' + data + '/results">Results</i></a>';
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