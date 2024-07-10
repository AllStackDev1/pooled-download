const downloadFile = async (url, connections, nextConnectionIndex, save) => {
  try {
    let conn = connections[nextConnectionIndex];
    console.log(conn)
    const fileContents = await conn.download(url);
    await save(fileContents);
  } catch (error) {
    connections.forEach((conn) => conn.close());
    if (error.message === "server already at capacity") {
      throw new Error("connection failed");
    } else {
      throw error;
    }
  }
}

const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
  const amountOfConnections =
    downloadList.length < maxConcurrency ? downloadList.length : maxConcurrency;
  let connections = [];
  let downloads = [];
  let nextConnectionIndex = 0;

  for (let i = 0; i < amountOfConnections; i++) {
    try {
      const connection = await connect();
      connections.push(connection);
    } catch (error) {}
  }

  if (!connections || connections.length === 0) {
    throw new Error("connection failed")
  }

  for (const url of downloadList) {
    downloads.push(downloadFile(url, connections, nextConnectionIndex, save))
    nextConnectionIndex++
    if (nextConnectionIndex >= connections.length) {
      nextConnectionIndex = 0;
    }
  }

  await Promise.all(downloads)

  connections.forEach((conn) => conn.close());

  return;
};

module.exports = pooledDownload;
