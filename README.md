# Service Description of the Aggregator.

The repository is used to demonstrate the description of the aggregator service. The service is described using the [Function Ontology](https://fno.io/spec/). The description is then used to trace back the original events employed to generate the aggregation event.

### Prerequisites

1.  Clone the repository and install the dependencies using the following commands:

    ```
    git clone https://github.com/argahsuknesib/ssa-service-description-demo.git
    cd ssa-service-description-demo
    npm install
    ```

2.  Install the Community Solid Server. NOTE: Install the Community Solid Server globally instead of locally. Installing the Community Solid Server will cause component.js issues in the node_modules folder.

    ```
    npm install -g @solid/community-server
    ```

## Setup

### Setting up the Solid Pods with Data.

For the demonstration, we use the [DAHCC dataset](https://dahcc.idlab.ugent.be/dataset.html)
which is an anonymized dataset of patients who lived in UGent's HomeLab.
Each patient owns a Solid pod to themselves.
We use four patients for the demonstration.
The `/scripts/data/` folder contains the data to spin up the Solid pod for each patient with
the [DAHCC dataset](https://dahcc.idlab.ugent.be/dataset.html)

To spin up the Solid pods, run the following command from the root of the repository.

```bash
npm run start-solid-server
```

This will generate the Solid pod for the patients at http://localhost:3000/.
For example, the Solid pod for patient 1 will be at http://localhost:3000/dataset_participant1/.

The `/data/` folder will contain the dataset for the patients after we load it up in the next step.

### Loading the data into the Solid Pods.

After the Solid pods are set up,
we would like to load some test data to aggregate over.
The dataset we are using is the [DAHCC dataset](https://dahcc.idlab.ugent.be/dataset.html).
For simplicity, we have mapped a portion of the DAHCC dataset to N3 files
in [this repository](https://github.com/argahsuknesib/dahcc-heartrate).

1. To get the dataset clone this repository with

   ```bash
   git clone https://github.com/argahsuknesib/dahcc-heartrate.git
   ```

2. To load up the data,
   we use the [LDES in Solid Observations Replay repository](https://github.com/SolidLabResearch/LDES-in-SOLID-Semantic-Observations-Replay).
   Clone the repository with

   ```bash
   git clone https://github.com/SolidLabResearch/LDES-in-SOLID-Semantic-Observations-Replay
   ```

3. Go to the `engine` folder and install the dependencies with

   ```bash
   cd engine && npm install
   ```

4. Edit the `src/config/replay_properties.json` file by adding the location of the folder in the "datasetFolders" field
   where you cloned the `dahcc-heartrate` repository.
   Add the location of the Solid pod's `data` folder in the "lilURL" field.

   For example,

   ```
   "lilURL" : "http://localhost:3000/dataset_participant1/data/"
   ```

5. Start the engine with

   ```bash
   npm start
   ```

   The output should look similar to the following:

   ```shell
   > challenge-16---replay---backend---typescript@1.0.0 start

   > tsc && node dist/app.js`

   {port: [Getter], loglevel: [Getter], logname: [Getter], datasetFolders: [Getter], credentialsFileName: [Getter], lilURL: [Getter], treePath: [Getter], chunkSize: [Getter], bucketSize: [Getter], targetResourceSize: [Getter], default: {port: '3001', loglevel: 'info', logname: 'WEB API', datasetFolders: C:\\nextcloud\\development\\challenge16-replay\\main\\Challenge 16 - Replay - Backend - Typescript\\data', credentialsFileName: null, lilURL: 'http://localhost:3000/test/', treePath: 'https://saref.etsi.org/core/hasTimestamp', chunkSize: 10, bucketSize: 10, targetResourceSize: 1024}}

   2022-12-08T14:58:54.612Z [WEB API] info: Express is listening at http://localhost:3001
   ```

### Starting the web app to load

The web app is a simple Vue app that allows you to load the data into the Solid pods.

1. To start the web app, run the following command from the root of the repository.

   ```bash
   cd webapp && npm install && npm run dev
   ```

2. Open the web app, and select a dataset to be loaded. Click on the `Load selected dataset` button.
3. Click on the `Sort observation subjects` button.
4. Click on the `submit next observation` button 3 times, till you see the replayer count as 3.
   Now the pod will have 3 observations.
5. Click on the `Submit remaining observations` button to submit the rest.
   The data will be loaded up in the Solid pod.

### Starting the aggregation on the Solid Pod.

Open a new instance of the terminal.

1. Build the project by running the following command from the root of the repository.

   ```bash
   npm run build
   ```

2. To start the solid stream aggregator, run the following command.

   ```bash
   npm run start aggregation
   ```

3. The solid stream aggregator will expose an HTTP server at http://localhost:8080/
   The aggregator server will expose API endpoints, such as '/averageHRPatient1' which registers the following query:

   ```sparql
      PREFIX saref: <https://saref.etsi.org/core/>
   PREFIX dahccsensors: <https://dahcc.idlab.ugent.be/Homelab/SensorsAndActuators/>
   PREFIX : <https://rsp.js/>
   REGISTER RStream <output> AS
   SELECT (AVG(?o) AS ?averageHR1)
   FROM NAMED WINDOW :w1 ON STREAM <http://localhost:3000/dataset_participant1/data/> [RANGE 10 STEP 2]
       WHERE{
             WINDOW :w1 { ?s saref:hasValue ?o .
                         ?s saref:relatesToProperty dahccsensors:wearable.bvp .}
             }
   ```

4. Once the aggregator is running, open a new instance of the terminal and run the following command to do a request to the API endpoint.

   ```bash
   curl http://localhost:8080/averageHRPatient1
   ```

   The aggregation events will be written to the aggregation pod, in LDP containers based on the bucket size (present in the './src/config/ldes_properties.json' file). The bucket size is set to a default of 1000. The bucket size can be changed if required.

   The aggregation events are being written into the LDES in LDP present at http://localhost:3000/aggregation_pod/aggregation/ into LDP containers.

### Service Description of the Solid Stream Aggregator

Now that the aggregator has aggregated the data, the events are being written as LDP resources into the aggregation pod.

The aggregation events can be then queried by the client. We also wish to know how the aggregation event was generated.

Since an aggregation event is in an LDP resource inside an LDP container. We describe the aggregation function by using the Function Ontology in the LDP container's metadata file.

1. Search for an LDP resource in which you are interested to get the metadata and copy its URL.

2. Use the following command to get the metadata of the aggregation function which generated the aggregation event.

```bash
node dist/scripts/metadata_container.js get-metadata -r <URL of the LDP resource>
```

You will see the triples describing the aggregation function in your console, as shown below (an example).

```
[...]
<http://example.org/aggregation_function_execution> <http://w3id.org/rsp/vocals-sd#registeredStreams> <http://localhost:3000/dataset_participant1/data/> .
<http://example.org/aggregation_function_execution> <http://example.org/aggregation_start_time> "2022-11-07T09:27:17.5890" .
<http://example.org/aggregation_function_execution> <http://example.org/aggregation_end_time> "2024-11-07T09:27:17.5890" .
<http://example.org/aggregation_function_execution> <http://example.org/last_execution_time> 1687439752719 .
[...]
```

We are also interested to see the original events which were used to generate the aggregation event. By being able to retrieve the original events, we can verify the aggregation function, as well as the aggregation event. This creates a provenance chain of the aggregation event.

3. Use the following command to get the metadata of the original events from the participant's pod which were used to generate the aggregation event.

```bash
node dist/scripts/original_events.js trace -r <URL of the LDP resource>
```

Now you will see the original events which were used to generate the aggregation event in the console, as shown below (an example, you will see different events based on your LDP resource).

```
https://dahcc.idlab.ugent.be/Protego/_participant1/obs982
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1482
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1982
https://dahcc.idlab.ugent.be/Protego/_participant1/obs983
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1483
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1983
```

### Conclusion

The description of the aggregator events enables the query agent to retrieve the relevant aggregated relevant data from the solid pod. In the future, work will be done towards a network of query agents where the metadata can be used across different solid pods to check if there is already an aggregation that can be re-used to answer a query. Thus, it will reduce the load on the aggregator and enable the aggregator's scalability.

### Lessons Learned

The aggregator involves writing the aggregation events to the pod in a fast-moving fashion. This has led to an issue with the LDES in LDP specification as the library does a patch delete and patch insert to update the most recent LDP container in the `ldp:inbox` predicate.
However, since the speed of aggregation event generation and writing to the pod is very fast, the patch delete and patch insert operations are not able to keep up with the speed of the aggregation event generation. This leads to the LDP container in the `ldp:inbox` predicate being not deleted but appended. Thus, you end up with multiple LDP containers as an inbox which violates the LDES in LDP specification. The issue is documented in the repository of VersionAwareLDESinLDP [here](https://github.com/woutslabbinck/VersionAwareLDESinLDP/issues/31).

## License

This code is copyrighted by [Ghent University - imec](https://www.ugent.be/ea/idlab/en) and released under the [MIT Licence](./LICENCE)

## Contact

For any questions, please contact [Kush](mailto:kushagrasingh.bisen@ugent.be).
