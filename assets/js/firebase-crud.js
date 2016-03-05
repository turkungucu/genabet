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
        	p.dateUpdated = Firebase.ServerValue.TIMESTAMP;
            return idRef(obj.id).update(p);
        } else {
        	p.dateCreated = Firebase.ServerValue.TIMESTAMP;
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