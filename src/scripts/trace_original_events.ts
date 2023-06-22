import { LDESinLDP, LDPCommunication } from "@treecg/versionawareldesinldp";
const query_engine = require('@comunica/query-sparql-link-traversal-solid').QueryEngine;
const engine = new query_engine();
const aggregation_pod_location: string = "http://localhost:3000/aggregation_pod/aggregation/";
const linked_data_fetch = require('ldfetch');
const fetch_ld = new linked_data_fetch({});
const N3 = require('n3');
const QueryEngine = require('@comunica/query-sparql').QueryEngine;
const myEngine = new QueryEngine();

let query_window = `
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX saref: <https://saref.etsi.org/core/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX vocals: <http://w3id.org/rsp/vocals-sd#>
SELECT ?aggregation_event ?aggregation_window_start ?aggregation_window_end ?resource WHERE {
    ?aggregation_event dct:source ?resource ;
                       vocals:startedAt ?aggregation_window_start;
                       vocals:endedAt ?aggregation_window_end ;
                       saref:hasValue ?value .
                       FILTER ((?value) = "-103.83557"^^xsd:float)
}
`;

async function main_two() {
    const binding_stream = await engine.queryBindings(query_window, {
        sources: [aggregation_pod_location],
        lenient: true,
    });
    binding_stream.on('data', async (binding: any) => {
        let resource = binding.get('resource').value;;
        let registered_stream: string = await get_container_stream_metadata(resource);
        let aggregation_event_window_start = binding.get('aggregation_window_start').value;
        let aggregation_event_window_end = binding.get('aggregation_window_end').value;
        if (registered_stream !== undefined) {
            get_original_events(registered_stream, aggregation_event_window_start, aggregation_event_window_end);
        }
    })
}

async function main() {    
    let resource = "http://localhost:3000/aggregation_pod/aggregation/1687420770532/ffe8e2a0-b4d0-48f2-b96c-e0f2dd1cb94b"
    let registered_stream = await get_container_stream_metadata(resource);    
    let resource_metadata = await fetch_ld.get(resource).catch((error: any) => {
        console.log(error);
    });
    const store = new N3.Store(await resource_metadata.triples);
    const binding_stream = await myEngine.queryBindings(
        `
        select ?timeEnded ?timeStarted where {
            ?s <http://w3id.org/rsp/vocals-sd#endedAt> ?timeEnded .
            ?s <http://w3id.org/rsp/vocals-sd#startedAt> ?timeStarted .
        }
        `,{
            sources: [store]
        }
    );

    binding_stream.on('data', async (binding: any) => {
        console.log("binding");
        
        await get_original_events(registered_stream, binding.get('timeStarted').value, binding.get('timeEnded').value);
    });
}

async function get_original_events(registered_stream: string, aggregation_event_window_start: Date, aggregation_event_window_end: Date) {
    const communication = new LDPCommunication();    
    const ldes_in_ldp = new LDESinLDP(registered_stream, communication);
    let aggregation_event_window_start_date = new Date(aggregation_event_window_start);    
    let aggregation_event_window_end_date = new Date(aggregation_event_window_end);    
    const lil_stream = await ldes_in_ldp.readAllMembers(aggregation_event_window_start_date, aggregation_event_window_end_date);
    lil_stream.on('data', async (member: any) => {
        console.log(member);
    });
}

async function get_container_stream_metadata(ldp_resource: string) {
    let ldp_container_meta: string = ldp_resource.split("/").slice(0, -1).join("/") + "/.meta";
    let metadata = await fetch_ld.get(ldp_container_meta).catch((error: any) => {
        console.log(error);
    });    
    if (metadata !== undefined) {
        const store = new N3.Store(await metadata.triples);
        for (const quad of store) {
            if (quad.predicate.value === "http://w3id.org/rsp/vocals-sd#registeredStreams") {
                return quad.object.value;
            }
            else {
            }
        }
    }
    else {
    }
}

main();
