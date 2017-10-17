// temporary variables for project and username; should be stored/fetched from the server
var projectName = 'SynBio Project';
var username = 'O. Loompa';

// USER SETTINGS FUNCTIONS 
function openUserSettings() {
    $(".user-settings").css({"height":"85px","padding":"20px 20px 5px 10px"});
    // $(".pageOverlay").css({"backgroundColor":"rgba(0,0,0,0.6)","width":"100%"})
}

function closeUserSettings() {
    $(".user-settings").css({"height":"0px","padding":"0px 20px 0px 10px"});
    // $(".pageOverlay").css({"backgroundColor":"rgba(0,0,0,0)","width":"0px"})
}

// NAVBAR
$(function(){
    $('.navbar').html(
        '<div class="container">' +
            '<div class="row">' +
                '<div class="col-2">' +
                    '<img src="./images/logo/phoenix_banner_black.png">' +
                '</div>' +
                '<div class="col-8">' +
                    '<div class="row">' +
                        '<div class="col-12">' +
                            '<div class="project-name" id="project-name">' +
                                projectName +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    );
});

// fixes the links based on the id
$(function(){
    if ($('#spc-navbar').length == 1) {
        $('.spc').addClass('active');
        $('.dsg a').addClass('disabled');
        $('.bld a').addClass('disabled');
        $('.tst a').addClass('disabled');
    }
    if ($('#dsg-navbar').length == 1) {
        $('.dsg').addClass('active');
        $('.bld a').addClass('disabled');
        $('.tst a').addClass('disabled');
    }
    if ($('#bld-navbar').length == 1) {
        $('.bld').addClass('active');
        $('.tst a').addClass('disabled');
    }
    if ($('#tst-navbar').length == 1) {
        $('.tst').addClass('active');
    }
});
    

// FOOTER
$(function(){
    $('.footer').html(
        '<span>' +
            '<img src="./images/logo/cidar_s.png">' +
        '</span>' +
        '<span>' +
            '<img src="./images/logo/BU.png">' +
        '</span>' +
        '<span>' +
            '<img src="https://www.nsf.gov/images/logos/nsf1.jpg">' +
        '</span>' +
        '<span>' +
            '<img src="./images/logo/ONRlogo.png">' +
        '</span>' +
        '<p class="text-muted">Funding for this project was provided by National Science Foundation' +
            'under CPS Frontier #1446607 and by the Office of Naval Research #N00014-11-1-10725.</p>' +
        '<div>' +
            '<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">' +
                '<img alt="Creative Commons License" src="http://i.creativecommons.org/l/by-sa/4.0/88x31.png">' +
            '</a>' +
            '<p class="text-muted">Phoenix is licensed under a' +
                '<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">' +
                    'Creative Commons Attribution-ShareAlike 4.0 International License' +
                '</a>' +
                '.' +
            '</p>' +
        '</div>' +
        '<p class="text-muted">Phoenix Web App was created by Kat, Oompa Loompa Extraordinaire</p>'
    );
});


// VisBOL functions used on DESIGN and TEST Pages

function getSBOL(sbolURI) {
    var sbol;
    
    var settings = {
        url: sbolURI,
        type: "get",
        dataType: "xml",
        async: false,
    };

    $.ajax(settings).done(function (response) {
        sbol = (new XMLSerializer()).serializeToString(response);
    });
    return sbol;
}

function getVisBOL(sbol) {
    var visdata;
    var visURI = "http://api.synform.io/render/svg/";

    var postSettings = {
        url: "http://api.synform.io/render/svg/",
        type: "post",
        data: sbol,
        async: false,
        success: function(data) {
            console.log(data)
            visdata = data;
        },
        error: function(){
            alert("Cannot get data");
        }
    };

    $.ajax(postSettings).done(function () {
    });

    $('#design').html(
        '<svg id="visSVG" style="visibility: hidden;">' + visdata
    );
    return visdata;
}

function loadVisBOL(sbolURI) {
    svgLayer.activate(); // activate correct Layer

    sbol = getSBOL(sbolURI);    
    visdata = getVisBOL(sbol);

    if (svgLayer._children.length > 0) {
        // var numChildren = project._children[0]._children.length;
        svgLayer.removeChildren(); // removes previous image/highlights
    }

    new Item(paper.project.importSVG(visdata));

    svgLayer._children[0].position.x = view.center.x;
    // removes the extra character before the name
    svgLayer._children[0]._children[1].content = svgLayer._children[0]._children[1].content.substring(2,svgLayer._children[0]._children[1].content.length-1)

    svgLayer._children[0].lastChild._children[0].remove(); // removes the border around the image
    svgLayer._children[0].lastChild._children[0]._segments[1]._point._x += -50 // removes extra "tail" for horizontal line
    // project._children[0]._children[0]._children[lastchild-1].remove();

}