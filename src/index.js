(function(){

    'use strict';

    var $ = require('jquery');
    var d3 = require('d3');
    var _ = require('lodash');

    function getData(){
        
        var data;

        $.ajax({
            url: 'http://api.opendata500.com/api/v1/results/Canada',
            success: function(raw){
                data = raw;
                console.log(data);
                parseData(data);
            }
        });

        return data;

    };

    function parseData(data){

        var responses = {
            industries: _.chain(data)
                .map('what_industry_best_describes_your_company')
                .reduce(function(sum,value){
                    return sum.concat(value);
                },[])
                .countBy()
                .value(),
            datatypes: _.chain(data)
                .map('what_types_of_open_data_does_your_company_use')
                .reduce(function(sum,value){
                    return sum.concat(value);
                },[])
                .countBy()
                .value(),
        };

        console.log(responses);
        return responses;

    };

    getData();

})();