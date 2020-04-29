/**
 *  Store all started docker container IDs
 */

class StartedContainers {
  constructor() {
    this.containers = new Set();
  }

  /**
   * Add started docker container ID
   * @param containerId
   */
  addContainer(containerId) {
    this.containers.add(containerId);
  }

  /**
   * Get all started docker container IDs
   *
   * @return {*[]}
   */
  getContainers() {
    return [...this.containers];
  }
}

module.exports = StartedContainers;
