var db = new PouchDB('cradb');
var dbUrl = 'http://127.0.0.1:5984/cradb';

db.replicate.to(dbUrl).then(function (result) {
    listWord();
}).catch(function (err) {
    listWord();
    console.log(err);
});

function listWord() {
    db.replicate.from(dbUrl);
    db.allDocs({
        include_docs: true,
        attachments: true
    }).then(function (result) {
        result.rows.sort(function () {
            return 1;
        });
        let list = document.getElementById("list");
        let htmlStr = "";
        for (var i = 0; i < result.rows.length; i++) {
            htmlStr += "<p>" + result.rows[i].doc.name + "<a href='#' data-id='" + result.rows[i].doc._id + "' data-rev='" + result.rows[i].doc._rev + "' onclick='delWord(this)'>删除</a></p>";
        }
        list.innerHTML = htmlStr;
    }).catch(function (err) {
        console.log(err);
    });
}

function addWord() {
    let tObj = document.getElementById("input_text");
    if (!tObj.value) {
        alert("不能为空");
        return;
    }
    db.put({
        _id: Date.now().toString(),
        name: tObj.value,
        createTime: Date.now(),
    });
    db.replicate.to(dbUrl);
    listWord();
}

function delWord(_this) {
    let _id = _this.getAttribute("data-id");
    let _rev = _this.getAttribute("data-rev");
    db.remove(_id, _rev);
    db.replicate.to(dbUrl);
    listWord();
}