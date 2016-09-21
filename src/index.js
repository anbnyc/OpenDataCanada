(function(){

    'use strict';

    var $ = require('jquery');
    window.d3 = require('d3');
    window._ = require('lodash');

    function getData(){
        
        var data;

        $.ajax({
            url: 'http://api.opendata500.com/api/v1/results/Canada',
            success: function(data){
                controller(data);
            }
        });

        return;

    };

    function parseSankey(data){

        var sankeyData = {
            nodes: [],
            links: []
        };

        var i = -1;
        var sourceNodes = _.chain(data)
            .reduce(function(sum,value){
                return sum.concat(value.what_industry_best_describes_your_company)
            },[])
            .uniq()
            .map(function(each){
                i++;
                return {
                    node: i,
                    name: 'source_'+each
                }
            })
            .value();

        var targetNodes = _.chain(data)
            .reduce(function(sum,value){
                return sum.concat(value.what_types_of_open_data_does_your_company_use)
            },[])
            .uniq()
            .map(function(each){
                i++;
                return {
                    node: i,
                    name: 'target_'+each
                }
            })
            .value();

        sankeyData.nodes = sourceNodes.concat(targetNodes);

        _.each(data,function(x){
            var industry = x.what_industry_best_describes_your_company;
            var dataset = x.what_types_of_open_data_does_your_company_use;
            _.each(industry, function(ind){
                _.each(dataset, function(dat){
                    var source = _.find(sankeyData.nodes, {'name': 'source_'+ind}).node;
                    var target = _.find(sankeyData.nodes, {'name': 'target_'+dat}).node;
                    var exists = _.filter(sankeyData.links, o => o.source === source && o.target === target );
                    if(exists.length > 0){
                        exists[0].value++;
                    } else {
                        sankeyData.links.push({
                            source: source,
                            target: target,
                            value: 1
                        });
                    }
                });
            });
        });

        return sankeyData;

    };

    function controller(data){

        var sankeyData = parseSankey(data);
        buildSankey(sankeyData);

    };

    function buildSankey(data){

        var sankey = {};

        var options = {
            data: data,
            dims: {
                x: 'industry',
                y: 'dataset'
            },
            element: 'sankey',
            height: 500,
            parent: d3.select('#sankey'),
            values: 'basic5',
            width: 1000
        };

        sankey.c = d3.init(options);
        sankey.c = d3.resize(sankey.c);
        sankey.c = d3.update(sankey.c);

    };

    function parseBar(data){

    };

    function buildBar(data){

    };

    getData();

})();