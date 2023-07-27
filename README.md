# Service Description of the Aggregator.

The repository is used to demonstrate the description of the aggregator service. The service is described using the [Function Ontology](https://fno.io/spec/). The description is then used to trace back the original events employed to generate the aggregation event.

### Prerequisites

1.  Clone the repository and install the dependencies using the following commands:

    ```
    git clone https://github.com/SolidLabResearch/aggregator-description-demo.git
    cd aggregator-description-demo
    npm install
    npm run build
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
We use one pod with data from one patient for the demonstration.
The `/pod/data/` folder contains the data to spin up the Solid pod for each patient with
the [DAHCC dataset](https://dahcc.idlab.ugent.be/dataset.html)

To spin up the Solid pods, run the following command from the root of the repository.

```bash
npm run start-solid-server
```

This will generate the Solid pod for the patients at http://localhost:3000/.
For example, the Solid pod for patient 1 will be at http://localhost:3000/dataset_participant1/.
The aggregated data is written to the aggregation pod at http://localhost:3000/aggregation_pod/
For the simplicity of the demonstration, we have already aggregated and written the data to the aggregation pod.

### Service Description of the Solid Stream Aggregator

The aggregated events are written as LDP resources into the aggregation pod.

The aggregation events can be then queried by the client. We also wish to know how the aggregation event was generated.

Since an aggregation event is in an LDP resource inside an LDP container. We describe the aggregation function by using the Function Ontology in the LDP container's metadata file.

1. Use the following command to get the metadata of the aggregation function which generated the aggregation event. For the demo, we use the LDP resource at `http://localhost:3000/aggregation_pod/aggregation/1690380109955/08efbb85-c262-40a1-bfd9-2f4991049863`

```bash
node dist/scripts/metadata_container.js get-metadata -r http://localhost:3000/aggregation_pod/aggregation/1690380109955/08efbb85-c262-40a1-bfd9-2f4991049863
```

You will see the triples describing the aggregation function in your console, as shown below.

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
node dist/scripts/original_events.js trace -r http://localhost:3000/aggregation_pod/aggregation/1690380109955/08efbb85-c262-40a1-bfd9-2f4991049863
```

Now you will see the original events which were used to generate the aggregation event in the console, as shown below

```
https://dahcc.idlab.ugent.be/Protego/_participant1/obs988
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1487
https://dahcc.idlab.ugent.be/Protego/_participant1/obs987
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1988
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1488
https://dahcc.idlab.ugent.be/Protego/_participant1/obs1987
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
