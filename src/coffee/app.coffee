App = angular.module 'App', ['ngRoute', 'ngResource']

App.run ['$rootScope', '$http',
    ($rootScope, $http) ->

        httpPromise = $http.get 'jsons/bookshelf_rel.json'

        httpPromise.then (res) ->
            setTimeout () ->
                $rootScope.model = res.data
                $rootScope.$apply()
            , 100
]
