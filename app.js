const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchScoreDbObjectToResponseObject = (dbObject) => {
  return {
    platerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API 1 list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2 specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE 
      player_id =${playerId};`;
  const playerArray = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(playerArray));
});

//API 3 Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name ='${playerName}'
  WHERE
    player_id = ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4 match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE 
      match_id =${matchId};`;
  const matchArray = await database.get(getMatchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(matchArray));
});

//API 5 list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      *
    FROM
      player_match_score
      NATURAL JOIN
      match_details
    WHERE 
      player_id =${playerId};`;
  const playerMatchesArray = await database.all(getPlayerMatchesQuery);
  response.send(
    playerMatchesArray.map((eachPlayerMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachPlayerMatch)
    )
  );
});

//API 6 list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
  SELECT *
  FROM 
    player_match_score
    NATURAL JOIN player_details
  WHERE
    match_id =${matchId};`;

  const matchPlayerArray = await database.all(getMatchPlayerQuery);
  response.send(
    matchPlayerArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 7 statistics of the total score, fours, sixes of a specific player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
  SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM
    player_match_score
    NATURAL JOIN
    player_details
  WHERE 
    player_id =${playerId};`;
  const playerMatchArray = await database.get(getMatchPlayerQuery);
  response.send(playerMatchArray);
});

module.exports = app;
