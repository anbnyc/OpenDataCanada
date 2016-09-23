(function(){

    'use strict';

    var $ = require('jquery');
    window.d3 = require('d3');
    window._ = require('lodash');

    function getData(){

        // API request sends data to controller
        $.ajax({
            url: 'http://api.opendata500.com/api/v1/results/Canada',
            success: function(data){
                controller(data);
            }
        });
    }

    function controller(data){

        // for each viz, shape data then pass to d3
        var sankeyData = parseSankey(data);
        buildSankey(sankeyData);

        var barData = parseBar(data);
        buildBar(barData);

        var mapData = parseMap(data);
        buildMap(mapData);

    }

    function parseSankey(data){

        var sankeyData = {
            nodes: [],
            links: []
        };

        var nodeTypes = [
            {
                name: "source",
                variable: "what_industry_best_describes_your_company"
            },
            {
                name: "target",
                variable: "what_types_of_open_data_does_your_company_use"
            }
        ];

        var i = -1;
        for (let nodeType of nodeTypes){

            var newNodes = _.chain(data)
                .reduce(function(sum,value){
                    return sum.concat(value[nodeType.variable]);
                },[])
                .uniq()
                .map(function(each){
                    i++;
                    return {
                        node: i,
                        name: nodeType.name+"_"+each
                    };
                })
                .value();

            sankeyData.nodes = sankeyData.nodes.concat(newNodes);
        }

        _.each(data,function(x){
            var industry = x.what_industry_best_describes_your_company;
            var dataset = x.what_types_of_open_data_does_your_company_use;
            _.each(industry, function(ind){
                _.each(dataset, function(dat){
                    var source = _.find(sankeyData.nodes, {"name": "source_"+ind}).node;
                    var target = _.find(sankeyData.nodes, {"name": "target_"+dat}).node;
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

    }

    function buildSankey(data){

        var sankey = {};

        var options = {
            data: data,
            dims: {
                x: "industry",
                y: "dataset"
            },
            element: "sankey",
            height: 500,
            parent: d3.select("#sankey"),
            values: "basic5",
            width: 900
        };

        sankey.c = d3.init(options);
        sankey.c = d3.resize(sankey.c);
        sankey.c = d3.update(sankey.c);

    }

    function parseBar(data){
        
        var vizValues = {
            'Very Important/Très importantes': {
                rank: 1,
                color: "purple40"
            },
            'Important/Importantes': {
                rank: 2,
                color: "purple20"
            },
            'Fairly Important/Légèrement importantes': {
                rank: 3,
                color: "purple"
            },
            'Slightly Important': {
                rank: 4,
                color: "lightgray"
            }
        };

        var barData = _.chain(data)
            .map(function(o){
                var key = _.filter(_.keys(vizValues), function(p){
                    return p.search(o.how_important_is_open_data_to_your_company) !== -1;
                });
                return key[0];
            })
            .countBy()
            .map(function(value,key){
                return {
                    howImportant: key,
                    value: value
                };
            })
            .value();

        return { barData: barData, vizValues: vizValues };
    }

    function buildBar(data){

        var bar = {};
        
        var options = {
            data: data.barData,
            dims: {
                x: "howImportant",
                y: "value",
                color: "howImportant",
                label: "value",
                yLabel: "Responses"
            },
            element: "rect",
            height: 500,
            parent: d3.select("#bar"),
            values: data.vizValues,
            width: 900
        };

        bar.c = d3.init(options);
        bar.c = d3.resize(bar.c);
        bar.c = d3.update(bar.c);
    }

    function parseMap(data){

        var mapData = _.chain(data)
                .map("province")
                .countBy()
                .value();

        return mapData;

    }

    function buildMap(data){

        var width = 1000,
            height = 500;

        var projection = d3.geoAlbers()
            .scale(800)
            .translate([400,550]);

        var path = d3.geoPath()
            .projection(projection);

        var svg = d3.select('#map').append('svg')
            .attr('width',width)
            .attr('height',height);

        // file downloaded from https://raw.github.com/mdgnkm/SIG-Map/master/canada.json
        d3.json('assets/canada.json', function(error,geojson){
            _.each(geojson.features,function(feature){
                // var accentFreeName = feature.properties.NAME ? feature.properties.NAME.replace('é','e') : '';
                if(_.keys(data).indexOf(feature.properties.NAME) !== -1){
                    feature.properties.companies = data[feature.properties.NAME];
                }
            });

            svg.selectAll('path')
                .data(geojson.features)
                .enter().append('path')
                .attr('class','border')
                .style('fill','#ffffff')
                .style('stroke','#000000')
                .attr('d',path);

            var groups = svg.selectAll('g')
                .data(geojson.features)
                .enter().append('g')
                .attr('class','map-circle');

            groups.append('circle')
                .attr('cx',(d) => path.centroid(d)[0])
                .attr('cy',(d) => path.centroid(d)[1])
                .style('fill','#381759')
                .attr('r', (d) => d.properties ? (d.properties.companies ? 5+d.properties.companies : 0 ) : 5);

            groups.append('text')
                .attr('class','label-text')
                .attr('x',(d) => path.centroid(d)[0])
                .attr('y',(d) => path.centroid(d)[1])
                .attr('opacity',1)
                .style('color','#000000')
                .html((d) => d.properties.NAME + ': ' + (d.properties.companies ? d.properties.companies : 0));

        });

    }

    getData();

})();