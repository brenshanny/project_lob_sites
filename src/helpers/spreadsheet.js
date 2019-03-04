import config from "../config";

export function load(tank, callback) {
  window.gapi.client.load("sheets", "v4", () => {
    window.gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: config.spreadsheetId,
        range: `${tank} Lobster Temps!A2:T`
      })
      .then(
        response => {
          const data = response.result.values;
          callback({ data });
        },
        response => {
          callback(false, response.result.error);
        }
      );
  });
}
