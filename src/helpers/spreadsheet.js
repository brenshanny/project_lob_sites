import config from "../config";

export function load(callback) {
  window.gapi.client.load("sheets", "v4", () => {
    window.gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: config.spreadsheetId,
        range: "Sheet1!A4:T"
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
