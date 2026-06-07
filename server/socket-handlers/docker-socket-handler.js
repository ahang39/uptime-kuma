const { sendDockerHostList } = require("../client");
const { checkLogin } = require("../util-server");
const { DockerHost } = require("../docker");
const { log } = require("../../src/util");
const { R } = require("redbean-node");

/**
 * Load a docker host bean and return a plain config object
 * @param {number} dockerHostID Docker host ID
 * @param {number} userID User ID for authorization
 * @returns {Promise<object>} Docker host config
 */
async function loadDockerHostConfig(dockerHostID, userID) {
    const bean = await R.findOne("docker_host", " id = ? AND user_id = ? ", [ dockerHostID, userID ]);
    if (!bean) {
        throw new Error("Docker host not found");
    }
    return {
        dockerDaemon: bean._dockerDaemon,
        dockerType: bean._dockerType,
        name: bean._name,
    };
}

/**
 * Handlers for docker hosts
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
module.exports.dockerSocketHandler = (socket) => {
    socket.on("addDockerHost", async (dockerHost, dockerHostID, callback) => {
        try {
            checkLogin(socket);

            let dockerHostBean = await DockerHost.save(dockerHost, dockerHostID, socket.userID);
            await sendDockerHostList(socket);

            callback({
                ok: true,
                msg: "Saved.",
                msgi18n: true,
                id: dockerHostBean.id,
            });
        } catch (e) {
            callback({
                ok: false,
                msg: e.message,
            });
        }
    });

    socket.on("deleteDockerHost", async (dockerHostID, callback) => {
        try {
            checkLogin(socket);

            await DockerHost.delete(dockerHostID, socket.userID);
            await sendDockerHostList(socket);

            callback({
                ok: true,
                msg: "successDeleted",
                msgi18n: true,
            });
        } catch (e) {
            callback({
                ok: false,
                msg: e.message,
            });
        }
    });

    socket.on("testDockerHost", async (dockerHost, callback) => {
        try {
            checkLogin(socket);

            let amount = await DockerHost.testDockerHost(dockerHost);
            let msg;

            if (amount >= 1) {
                msg = "Connected Successfully. Amount of containers: " + amount;
            } else {
                msg = "Connected Successfully, but there are no containers?";
            }

            callback({
                ok: true,
                msg,
            });
        } catch (e) {
            log.error("docker", e);

            callback({
                ok: false,
                msg: e.message,
            });
        }
    });

    socket.on("dockerContainerStart", async (dockerHostID, containerID, callback) => {
        try {
            checkLogin(socket);
            const dockerHost = await loadDockerHostConfig(dockerHostID, socket.userID);
            await DockerHost.startContainer(dockerHost, containerID);
            callback({ ok: true, msg: "Container started successfully." });
        } catch (e) {
            log.error("docker", e);
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("dockerContainerStop", async (dockerHostID, containerID, callback) => {
        try {
            checkLogin(socket);
            const dockerHost = await loadDockerHostConfig(dockerHostID, socket.userID);
            await DockerHost.stopContainer(dockerHost, containerID);
            callback({ ok: true, msg: "Container stopped successfully." });
        } catch (e) {
            log.error("docker", e);
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("dockerContainerRestart", async (dockerHostID, containerID, callback) => {
        try {
            checkLogin(socket);
            const dockerHost = await loadDockerHostConfig(dockerHostID, socket.userID);
            await DockerHost.restartContainer(dockerHost, containerID);
            callback({ ok: true, msg: "Container restarted successfully." });
        } catch (e) {
            log.error("docker", e);
            callback({ ok: false, msg: e.message });
        }
    });
};
