const link_traversal_query_engine = require('@comunica/query-sparql-link-traversal-solid').QueryEngine;
const my_engine = new link_traversal_query_engine();
const aggregation_ldes_in_ldp_location = "http://localhost:3000/aggregation_pod/aggregation/";
const ldfetch = require('ldfetch');
const ld_fetch = new ldfetch({});

let query = `
PREFIX dct: <http://purl.org/dc/terms/> 
PREFIX saref: <https://saref.etsi.org/core/> 
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
SELECT ?aggregation ?resource WHERE {
    ?aggregation dct:source ?resource .
    ?aggregation saref:hasTimestamp ?timestamp .
    ?aggregation saref:hasValue ?value .
    FILTER (?timestamp > "2021-05-01T00:00:00Z"^^xsd:dateTime)
    FILTER (?value > 0)
}
`;

async function main() {
    const binding_stream = await my_engine.queryBindings(query, {
        sources: [aggregation_ldes_in_ldp_location],
        lenient: true,
    });
    binding_stream.on('data', async (binding: any) => {
        let resource = binding.get('resource').value;
        let metadata = await get_container_metadata(resource);
        console.log(metadata);

    });
    binding_stream.on('end', () => {
        console.log("The stream has ended");
    });
    binding_stream.on('error', (error: any) => {
        console.log("The error is: ", error);
    });
}

async function get_container_metadata(ldp_resource: string) {
    let ldp_container_meta = ldp_resource.split("/").slice(0, -1).join("/") + "/.meta";
    let metadata = await ld_fetch.get(ldp_container_meta);
    return metadata.triples;
}

main();
