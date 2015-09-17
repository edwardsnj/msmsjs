# msmsjs

Developed by Chris Trenkov and Nathan Edwards. 

Try [demo.html](http://rawgit.com/edwardsnj/msmsjs/master/demo.html), [demo2.html](http://rawgit.com/edwardsnj/msmsjs/master/demo2.html), and [demo3.html](http://rawgit.com/edwardsnj/msmsjs/master/demo3.html).

To use `msmsjs` place the following in your HTML page's head element, after replacing `<specific-github-commit-hash>` appropriately. 

    <link rel="stylesheet" href="http://cdn.rawgit.com/edwardsnj/msmsjs/<specific-github-commit-hash>/css/spectrum-viewer.css" type="text/css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js" charset="utf-8"/>
    <script src="http://labratrevenge.com/d3-tip/javascripts/d3.tip.v0.6.3.js"/>
    <script src="http://cdn.rawgit.com/edwardsnj/msmsjs/<specific-github-commit-hash>/js/spectrum-viewer.js"/>

Place an empty div with class `panel` where the annotated spectrum should appear. 

    <div class="panel"/>

In javascript, call setSvg once to initialize the div, and then showSpectrum with the URL of the JSON data.

    var height = 300;
    var width = 1000;
    var ss = {}
    function show(panel,spectrum,path) {
      var key = panel+'.'+spectrum
      if (!ss[key]) { 
        setSvg(width, height, '.'+panel, spectrum);
        ss[key] = true;
      }
      showSpectrum(path,'.'+panel);
    }
    show('panel','spec1','data/psm.json');
