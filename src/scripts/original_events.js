"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require('commander');
const linked_data_fetch = require('ldfetch');
const fetch_ld = new linked_data_fetch({});
const N3 = require('n3');
const query_engine = require('@comunica/query-sparql-link-traversal-solid').QueryEngine;
const QueryEngine = require('@comunica/query-sparql').QueryEngine;
const versionawareldesinldp_1 = require("@treecg/versionawareldesinldp");
const myEngine = new QueryEngine();
const engine = new query_engine();
program
    .version('0.0.1')
    .description('Tracing the original events from the solid pod.')
    .name('original-events-tracer');
program
    .command('trace')
    .description('Trace the original events from the source.')
    .option('-r --resource <resource>', 'The resource of the aggregation event to trace the original events from the source solid pod')
    .parse(process.argv)
    .action((options) => {
    trace_original_events(options.resource);
});
program.parse();
function trace_original_events(resource) {
    return __awaiter(this, void 0, void 0, function* () {
        let stream = yield get_container_stream_metadata(resource).then((stream) => {
            let resource_metadata = fetch_ld.get(resource).catch((error) => {
                console.log(error);
            }).then((resource_metadata) => __awaiter(this, void 0, void 0, function* () {
                const store = yield new N3.Store(yield resource_metadata.triples);
                const binding_stream = yield myEngine.queryBindings(`
                select ?timestamp_to ?timestamp_from where {
                    ?s <http://w3id.org/rsp/vocals-sd#endedAt> ?timestamp_to .
                    ?s <http://w3id.org/rsp/vocals-sd#startedAt> ?timestamp_from .
                }
            `, {
                    sources: [store]
                });
                binding_stream.on('data', (binding) => __awaiter(this, void 0, void 0, function* () {
                    yield get_original_events(stream, binding.get('timestamp_from').value, binding.get('timestamp_to').value);
                }));
            }));
        });
    });
}
function get_original_events(registered_stream, aggregation_event_window_start, aggregation_event_window_end) {
    return __awaiter(this, void 0, void 0, function* () {
        const communication = new versionawareldesinldp_1.LDPCommunication();
        const ldes_in_ldp = new versionawareldesinldp_1.LDESinLDP(registered_stream, communication);
        let aggregation_event_window_start_date = new Date(aggregation_event_window_start);
        let aggregation_event_window_end_date = new Date(aggregation_event_window_end);
        const lil_stream = ldes_in_ldp.readAllMembers(aggregation_event_window_start_date, aggregation_event_window_end_date);
        (yield lil_stream).on('data', (member) => {
            console.log(member.quads[0].subject.value);
        });
    });
}
function get_container_stream_metadata(ldp_resource) {
    return __awaiter(this, void 0, void 0, function* () {
        let ldp_container_meta = ldp_resource.split("/").slice(0, -1).join("/") + "/.meta";
        let metadata = yield fetch_ld.get(ldp_container_meta).catch((error) => {
            console.log(error);
        });
        if (metadata !== undefined) {
            const store = new N3.Store(yield metadata.triples);
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
    });
}
