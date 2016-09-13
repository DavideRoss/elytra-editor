App = angular.module 'App', ['ngRoute', 'ngResource']

App.run ['$rootScope', '$http',
    ($rootScope, $http) ->

        $rootScope.showInput = false
        $rootScope.showErrors = false

        $rootScope.errors = []

        $rootScope.loadExample = (file) ->
            httpPromise = $http.get 'jsons/' + file

            httpPromise.then (res) ->
                setTimeout () ->
                    $rootScope.model = res.data
                    $rootScope.showErrors = false
                    $rootScope.$apply()
                , 1000

        $rootScope.loadExample 'torch.json'

        $rootScope.loadJson = () ->
            $rootScope.showErrors = false
            try
                $rootScope.model = JSON.parse $rootScope.inputJson
                $rootScope.showInput = false
            catch e
                $rootScope.jsonError = e.message

        $rootScope.$watch 'errors', () ->
            if $rootScope.errors && $rootScope.errors.length > 0
                $rootScope.showErrors = true
        , true
]
