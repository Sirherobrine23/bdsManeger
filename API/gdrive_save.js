module.exports = () => {
    global.bds_api_start = true
    const express = require("express");
    const app = express();
    var cors = require('cors');
    app.use(cors());
    app.use(require("body-parser").json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({ extended: true }));
    app.get("/:DI", (req, res) => {
        return res.send(`
        <html>
            <head></head>
            <body>
                <a>token Save</a>
                <p>
                    <textarea disabled>
                        ${req.params.DI}
                    </textarea>
                </p>
            </body>
        </html>
        `);
    });
    app.listen(2212);
}