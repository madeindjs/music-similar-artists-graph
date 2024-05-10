import Graph from "graphology";
import Sigma from "sigma";
import serializedGraph from "./graph.json";

// @ts-ignore
const graph = Graph.from(serializedGraph);

const container = document.getElementById("container");

if (!container) throw Error("container not found");

const sigmaInstance = new Sigma(graph, container, {});
