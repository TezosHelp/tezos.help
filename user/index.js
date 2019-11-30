$( document ).ready(function() {
    getTg();
    $('#addModal').on('show.bs.modal', function (event) {
        $("#status").html("")
        clear();
        const button = $(event.relatedTarget);
        console.log(button);
        const modal = $(this);
        const entryId = button.data('entryid')
        if (entryId) {
            console.log("edit entry: " + entryId);
            const catId = button.data('entrycategory')
            console.log("edit cat: " + catId);
            modal.find('#entryId').val(entryId)
            const entry = $( '#entry' + entryId ).html()
            const title = $(entry).find('h5').html()
            const url = $(entry).find('a').attr('href')
            const description = $(entry).find('p').html()
            const twitter = $(entry).find('.fa-twitter').attr('href')
            const facebook = $(entry).find('.fa-facebook').attr('href')
            modal.find('.modal-title').text('Edit content')
            modal.find('.modal-body #modalTitle').val(title);
            modal.find('.modal-body #modalUrl').val(url);
            modal.find('.modal-body #validationTextarea').val(description);
            modal.find('.modal-body #modalCategory').val(catId);
            if (twitter) {
                modal.find('.modal-body #modalTwitter').val(twitter);
            } if (facebook) {
                modal.find('.modal-body #modalFacebook').val(facebook);
            }
        } else {
            modal.find('.modal-title').text('Add content')
        }
    })
})
function validateForm() {
    console.log("Validate form");
    if (document.getElementById("modalTitle").value === "") {
        $("#status").html("No title!");
    } else if (document.getElementById("modalUrl").value === "") {
        $("#status").html("No link!");
    } else if (document.getElementById("modalCategory").value === "-1") {
        $("#status").html("No category!");
    } else {
        console.log("Check captcha!");
        console.log(window.location.hostname);
        if (window.location.hostname !== "localhost") {
            grecaptcha.execute();
        } else {
            console.log("Use fake token");
            sendForm('fakeToken');
        }
    }
    return false;
}
function sendForm(token) {
    $("#modalSubmit").addClass("disabled");
    console.log("Send form!");
    console.log("Token: " + token);
    const entryId = document.getElementById("entryId").value;
    const title = document.getElementById("modalTitle").value;
    const description = document.getElementById("validationTextarea").value;
    const category = document.getElementById("modalCategory").value;
    const url = document.getElementById("modalUrl").value;
    const twitter = document.getElementById("modalTwitter").value;
    const facebook = document.getElementById("modalFacebook").value;
    const obj = {entryId, title, description, category, url, twitter, facebook, token};
    $.post("user/req.php", obj, function (data) {
        $("#status").html(data);
        if (data === "Thank you for contributing!") {
            clear();
        }
        grecaptcha.reset();
    }).always(function() {
        grecaptcha.reset();
        $("#modalSubmit").removeClass("disabled");
    });
    return false;
}
function clear() {
    document.getElementById("modalTitle").value = "";
    document.getElementById("validationTextarea").value = "";
    document.getElementById("modalCategory").value = "";
    document.getElementById("modalUrl").value = "";
    document.getElementById("modalTwitter").value = "";
    document.getElementById("modalFacebook").value = "";
}
async function getTg() {
    $.get("./user/req.php?tg", function (data) {
        var parsed = JSON.parse(data);
        console.log('TG id: ' + parsed.counter);
        var newScript = document.createElement("script");
        newScript.src = "https://telegram.org/js/telegram-widget.js?7";
        newScript.setAttribute('data-telegram-post', "TezosAnnouncements/" + parsed.counter);
        newScript.setAttribute('data-userpic', "false");
        document.getElementById("widget").appendChild(newScript);
        $("#widget").css('visibility', 'visible');
    });
}