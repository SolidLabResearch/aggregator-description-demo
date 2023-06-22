import {
    LDESinLDP,
    LDESMetadata,
    LDPCommunication,
    SolidCommunication,
    RDF,
    LDES,
    extractLdesMetadata,
    LDESConfig,
    VersionAwareLDESinLDP,
    ILDES,
    getAuthenticatedSession,
} from "@treecg/versionawareldesinldp";
import { QueryAnnotationPublishing } from "./QueryAnnotationPublishing";
import {
    initSession
} from "../../utils/ldes-in-ldp/EventSource";
let CONFIG =
{
    "LIL_URL": "http://localhost:3000/aggregation_pod/aggregation/",
    "VERSION_PATH": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    "PREFIX_FILE": "",
    "TREE_PATH": "https://saref.etsi.org/core/hasTimestamp",
    "AMOUNT": 0,
    "BUCKET_SIZE": 10000,
    "CREDENTIALS_FILE_NAME": null,
    "LOG_LEVEL": "info"
}
import { RSPQLParser } from "../parsers/RSPQLParser";
import { Logger, ILogObj } from "tslog";
import { EndpointQueries } from "../../server/EndpointQueries";
import { Store } from "n3";
import { sleep } from "../../utils/GeneralUtil";

export class LDESPublisher {

    public initialised: boolean = false;
    private credentialsFileName: any = CONFIG.CREDENTIALS_FILE_NAME;
    private session: any;
    private lilURL: string = CONFIG.LIL_URL
    private prefixFile = CONFIG.PREFIX_FILE;
    private treePath = CONFIG.TREE_PATH;
    public config: LDESConfig;
    private amount = CONFIG.AMOUNT;
    private bucketSize = CONFIG.BUCKET_SIZE;
    private logLevel = CONFIG.LOG_LEVEL;
    private aggregationQuery: string = "";
    private parser: any;
    private versionPath: string = CONFIG.VERSION_PATH;
    private query_annotation_publisher: QueryAnnotationPublishing;
    public logger: Logger<ILogObj>;
    public endpoint_queries: EndpointQueries;

    constructor(latest_minutes_to_retrieve: number) {
        this.config = {
            LDESinLDPIdentifier: this.lilURL, treePath: this.treePath, versionOfPath: this.versionPath,
        }
        this.parser = new RSPQLParser();
        this.logger = new Logger();
        this.query_annotation_publisher = new QueryAnnotationPublishing();
        this.endpoint_queries = new EndpointQueries(latest_minutes_to_retrieve);
        this.initialise();
    }

    async initialise() {
        const communication = new LDPCommunication();
        const lil: ILDES = new LDESinLDP(this.lilURL, communication);
        let metadata: LDESMetadata | undefined;
        const versionAware = new VersionAwareLDESinLDP(lil);
        await versionAware.initialise(this.config);
        try {
            const metadataStore = await lil.readMetadata();
            const ldes = metadataStore.getSubjects(RDF.type, LDES.EventStream, null);
            if (ldes.length > 1) {
                console.log(`More than one LDES is present. We are extracting the first one at, ${ldes[0].value}`);
            }
            metadata = extractLdesMetadata(metadataStore, ldes[0].value);

        } catch (error) {
            console.log(error);
            console.log(`No LDES is present.`);
        }
        return true;
    }

    async publish(resourceList: any[], start_time: Date, end_time: Date) {
        if (resourceList.length === 0) {
            console.log("No resources to publish");
            return;
        }
        else {
            const config: LDESConfig = {
                LDESinLDPIdentifier: this.lilURL, treePath: this.treePath, versionOfPath: "1.0",
            }
            let query = this.endpoint_queries.get_query("averageHRPatient1")
            if (query != undefined) {
                this.query_annotation_publisher.publish(query, this.lilURL, resourceList, this.treePath, this.bucketSize, config, start_time, end_time, this.session).then(() => {
                    
                })
            }
        }

    }


}