/**
 * @typedef Node
 * @property {string} id
 * @property {string} name
 * @property {number} [weight]
 *
 * @typedef Link
 * @property {string} fromId
 * @property {string} toId
 * @property {number} [weight]
 */

class Graph {
  /** @type {Node[]} */
  #nodes = [];
  /** @type {Link[]} */
  #links = [];
  #nodeIds = new Set();

  /**
   * @param {Node} node
   */
  addNode(node) {
    if (this.#nodeIds.has(node.id)) throw Error(`Id ${node.id} already exists`);

    this.#nodeIds.add(node.id);
    this.#nodes.push({ ...node });

    return this;
  }

  /**
   * @param {Link} link
   */
  addLink(link) {
    if (!this.#nodeIds.has(link.fromId)) throw Error(`Id ${link.fromId} does not exist`);
    if (!this.#nodeIds.has(link.toId)) throw Error(`Id ${link.toId} does not exist`);

    this.#links.push({ ...link });
  }

  render() {
    const svg = document.createElement("svg");

    return svg.outerHTML;
  }
}

const graph = new Graph().addNode({ id: "alex", name: "alex" }).addNode({ id: "lorene", name: "lorene" });

console.log(graph.render());
