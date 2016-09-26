var Bookmark = (function($, Handlebars) {
    'use strict';

    var _templateCache,
        _bookmarksMarkedCache,
        _bookmarksDataCache = {},
        _currentSidebarData = {},

        _onToggle = function($sidebar, isActive) {
            if (isActive)
                $sidebar.removeAttribute(_removeBrackets(s.sidebar.open));
            else
                $sidebar.setAttribute(_removeBrackets(s.sidebar.open), "true");

            return;
        },

        _addToggleListenerCallback = function() {
            if (typeof s.sidebar.onToggle === "function") {
                var $sidebar = document.querySelector(s.sidebar.container);
                var isActive = _isSidebarActive($sidebar);
                s.sidebar.onToggle($sidebar, isActive);
            }
        },
        _addRemoveListeners = function() {
            var removable = document.querySelectorAll(s.sidebar.remove);
            removable = _filter(removable);

            for (var i = 0; i < removable.length; i++) {
                var $item = removable[i];

                (function($item) {

                    var group = $item.getAttribute("data-group");
                    var id = $item.getAttribute("data-id");

                    $item.addEventListener("click", function() {

                        //TODO: 
                        // Essa parte do código não está muito correta, poderia ser feito de outra forma.
                        // Quando o usuário clicar no x dentro da sidebar, para remover um item, também precisamos que 
                        // o item referente a ele, que está fora da sidebar também seja desmarcado. 
                        // Então, pego os itens reconhecidos como bookmarks inicialmente do "cache" e filtro pelo id do item
                        // clicado. 
                        // após isso, utilizo a função "_remove" para aplicar a rotina de remoção sobre esse item.
                        
                        var $filteredItem = _bookmarksMarkedCache.filter(function($el) {
                            return $el.getAttribute("data-id") == id;
                        });

                        if ($filteredItem)
                            $filteredItem = $filteredItem[0];

                        var bookmarks = _remove($filteredItem, group, id);

                        _currentSidebarData[group] = _filterFullData(_bookmarksDataCache[group], bookmarks[group]);
                        
                        _compile(_templateCache, _currentSidebarData);

                       
                    });

                })($item);
            }
        }; 


    var s = {
            element: "[bookmark]",
            storage: "bookmarks",
            activeAttr: "bookmark-active",
            sidebar: {
                template: 'views/sidebar.hbs',
                container: '[bookmarks-sidebar]',
                open: '[bookmarks-open]',
                toggle: '[bookmarks-toggle]',
                remove: '[bookmark-remove]',
                onToggle: _onToggle
            }
        },


        _add = function(item, group, id) {

            var bookmarks = _getStorage(s.storage);
            bookmarks = !bookmarks ? {
                [group]: []
            } : bookmarks;

            if (!bookmarks[group])
                bookmarks[group] = [];

            if (_exists(bookmarks[group], id) === -1)
                bookmarks[group].push(id);

            _setStorage(s.storage, bookmarks);
            item.setAttribute(s.activeAttr, "true");

            return bookmarks;
        },

        _remove = function(item, group, id) {
            var bookmarks = _getStorage(s.storage);
            var index = _exists(bookmarks[group], id);

            if (index !== -1) {
                bookmarks[group].splice(index, 1);
                item.removeAttribute(s.activeAttr);
                _setStorage(s.storage, bookmarks);
            }

            return bookmarks;
        },

        _getStorage = function(storage) {
            var data = localStorage.getItem(storage);
            return data ? JSON.parse(data) : false;
        },

        _setStorage = function(storage, data) {
            var json = JSON.stringify(data);
            return data ? localStorage.setItem(storage, json) : false;
        },

        _exists = function(bookmarksGrouped, id) {
            if (Array.isArray(bookmarksGrouped) && id) {
                var index = bookmarksGrouped.indexOf(id);
                return index;
            }

            return -1;
        },


        _addClickListenerList = function(list, callback) {
            var bookmarks = _getStorage(s.storage);

            for (var i = 0; i < list.length; i++) {
                var $item = list[i];

                /**
                 * @dica
                 * usando closure ("fechamento") para gerar uma função anonima 
                 * que cria uma nova referencia para $item   
                 */

                (function($item) {
                    var id = $item.getAttribute("data-id");
                    var group = $item.getAttribute("data-group");

                    if (/^[0-9]+$/.test(id) && bookmarks[group] && _exists(bookmarks[group], id) !== -1)
                        $item.setAttribute(_removeBrackets(s.activeAttr), "true");

                    $item.addEventListener('click', function() { callback($item, group, id); });
                })($item);
            }
            return;
        },

        _filter = function(list) {
            list = list || undefined;
            var filtered = false;

            if (!Array.isArray(list))
                list = Array.prototype.slice.call(list)

            var filtered = list.filter(function($item) {
                return $item.hasAttribute("data-group") && $item.hasAttribute("data-id");
            });

            return filtered;
        },

        _isActiveBookmark = function($item) {
            return ($item.hasAttribute(s.activeAttr) ? true : false);
        },

        _getAsyncRequest = function(url, callback, exec=true) {
            var xmlhttp = new XMLHttpRequest();

            var done = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    if (typeof callback === "function")
                        callback(xmlhttp.responseText);
                }
            };

            xmlhttp.onreadystatechange = done;
            xmlhttp.open("GET", url, true);

            if (!exec)
                return xmlhttp; 

            xmlhttp.send(null);
            
        },

        _compile = function(template, bookmarks) {
            var $el = document.querySelector(s.sidebar.container);

            //compila o arquivo de template com as informações corretas
            if ($el)
                $el.innerHTML = Handlebars.compile(template)(bookmarks);

            //carrega os listeners de remoção
            _addRemoveListeners(); 
            _addCloseSidebarListener(); 
        },

        _addCloseSidebarListener = function() {
            //TODO: 
            // Outra coisa "não tão bonita" feito nessa função. Preciso adicionar um eventListener de click
            // no 'x' no topo da sidebar, pois toda vez que clicamo s em remover um item, a sidebar é recompilada pelo 
            // Handlebars. Esse código poderia melhorar, por exemplo, poderiamos colocar apenas para o miolo da sidebar
            // ser recompilado e inserido à cada exclusão de item. Por causa do tempo, foi mais rápido utilizar o jquery 
            // para fazer isso.
            
            //sou preguiçoso, só usei o jQuery para encontrar o elemento mais facilmente. 
            var $closeEl = $(s.sidebar.container).find(s.sidebar.toggle); 

            if ($closeEl){
                $closeEl = $closeEl[0]; 
                $closeEl.addEventListener("click", _addToggleListenerCallback); 
            }
        },

        _isSidebarActive = function($sidebar) {
            return $sidebar.hasAttribute(_removeBrackets(s.sidebar.open)) ? true : false;
        },

        _removeBrackets = function(string) {
            return string.replace(/^[\[.#]+|[\].#]+$/g, "");
        },

        _addToggleListenerList = function(callback) {

            var toggleElements = document.querySelectorAll(s.sidebar.toggle);

            for (var i = 0; i < toggleElements.length; i++) {
                var $element = toggleElements[i];

                (function($element) {
                    $element.addEventListener('click', function() { callback($element); });
                })($element);
            }
        },

        _loadSidebar = function(bookmarks) {

            //deveria executar os 3 processos repetidamente
            // compila o template do cache
            // insere do HTML marcado data-sidebar
            // roda os listeners dentro da sidebar
    
         
            if (!_templateCache) {
                _getAsyncRequest(s.sidebar.template, function(template) {

                    if (!template) {
                       throw "Template não encontrado :(";
                    }

                    //grava no cache
                    _templateCache = template;
                    
                    //adicionar a função nos botões de toggle apenas da primeira vez
                    // está dentro dessa função para ter certeza que só foi ativado depois
                    // que o template está carregado. 
                    _addToggleListenerList(_addToggleListenerCallback);

                    //compila o template e adiciona dentro do container especificado
                    _compile(_templateCache, bookmarks);
                    
                    return;
                });

            } else {
                //compila o template e adiciona dentro do container especificado
                _compile(_templateCache, bookmarks);
            }
           
        },

        //FUNÇÃO AINDA NÃO UTILIZADA
        // _filterByTheCache = function(needles, haystack, identifier) {
        //     /**
        //      * Procura uma lista de ids no cache, só retorna os ids que NÃO EXISTIREM
        //      */

            
        //     if (!Array.isArray(needles))
        //        throw "Primeiro parâmetro não é um array"; 

        //    $filtered_needles = []; 

        //    for (var i = 0; i < needles.length; i++) {
               
        //    }

        //     $filtered_list = needles.filter(function(item){
        //         return needles.indexOf(item[identifier]) == -1; 
        //     });
        //     return $filtered_list; 
        // },

        _mergeBookmarks = function(bookmarks, detectedBookmarks) {
            
            if (!Array.isArray(detectedBookmarks))
                throw "A variável datectedBookmarks não é um array!"; 

            for (var i = 0; i < detectedBookmarks.length; i++) {
                var group = detectedBookmarks[i].getAttribute("data-group");
                var id = detectedBookmarks[i].getAttribute("data-id");

                if (bookmarks[group]) {
                    if (bookmarks[group].indexOf(id) == -1)
                        bookmarks[group].push(id); 
                }
            }
            
            return bookmarks; 
        },

        _generateApiList = function(bookmarks) {
           
            var urls = {}; 
            for (var group in bookmarks) {
                if (group && Array.isArray(bookmarks[group]) && bookmarks[group].length > 0) {
                    
                    //TODO: 
                    //Criar função para verificar com o cache de dados reais, se algum id já existe, se existir, não precisa
                    //mandar para api
                    //debugger

                    urls[group] = s.url.replace('{{group}}', group) + "?ids=" + bookmarks[group].join()
                }
                
            }

            return urls; 
        },

        _requestsApiList = function(list, callback) {
            
            for (var group in list) {
                
                (function (group, item) {
                    var xmlhttp = _getAsyncRequest(item, callback, false); 
                    xmlhttp.onreadystatechange = function(){
                        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                            if (typeof callback === "function")
                                callback(group, xmlhttp.responseText);
                        }
                    }
                    
                    xmlhttp.send(null); 
                })(group, list[group]);
      
            }
        },

        _filterFullData = function(cache, bookmarks) {
            // compara os dados de retorno com o que ja existe no cache
            // atualiza o cache com os dados que ainda não existem
            // retorna apenas os ids que estiverem no bookmarks

            var result = []; 
          
            for (var prop in cache) {
                if (bookmarks.indexOf(String(cache[prop].ID)) != -1)
                    result.push(cache[prop]); 
            }

            return result; 
        },

        _init = function(options, afterLoad, itemClick) {

            //extende os parametros passados pelo usuário
            s = $.extend(true, {}, s, options);
      
            //pega os elementos "bookmarks" na página
            var elements = document.querySelectorAll(s.element),
                filtered;

            //filtra esses elementos pelo data-id e data-group e cria um cache desse resultado
            _bookmarksMarkedCache = filtered = _filter(elements);

            console.log(itemClick); 

            //adiciona o listner de click para cada objeto reconhecido como favorito
            _addClickListenerList(filtered, function($item, group, id) { // <- dentro do click em algum favoritos
                //adiciona ou remove o item do localstorage e a marcação de activeAttr
                var bookmarks = _isActiveBookmark($item) ? _remove($item, group, id) : _add($item, group, id);
                
                _currentSidebarData[group] = _filterFullData(_bookmarksDataCache[group], bookmarks[group]);

                if (s.sidebar) 
                    _loadSidebar(_currentSidebarData);
                
                if (itemClick)
                    itemClick($item, _isActiveBookmark($item), _currentSidebarData);
                return;
            });
            
            
            if (s.sidebar) {
                
                if (!s.url)
                    throw "Parâmetro 'url' não definido"; 

                
                var bookmarks = _getStorage(s.storage);       
                
                // junta os bookmarks já marcados anteriormente com os detectados na página atual
                var merged = _mergeBookmarks(bookmarks, _bookmarksMarkedCache); 


                // cria um array de caminhos de api para esses bookmarks
                var list = _generateApiList(merged); 


                //_bookmarksObjectCache =  _getApiData(list); 
                
                /**
                 * @function
                 * _requestsApiList 
                 *
                 * Passamos como parâmetro uma lista de urls de API para cada group detectado e também passamos um callback 
                 * para ser executado quando a resposta retornar no servidor.
                 */

                _requestsApiList(list, function(group, response){

                    // callback que será executado quando retornar cada request para API. 
                    // gravar objeto em uma variável 
                   
                    if (group && response) {

                        //atualiza o cache
                        _bookmarksDataCache[group] = JSON.parse(response);

                        // compara os dados de retorno com o que ja existe no cache
                        // atualiza o cache com os dados que ainda não existem
                        // retorna apenas os ids que estiverem no bookmarks      

                        var bookmarks = _getStorage(s.storage); 
                        //console.log(bookmarks);            

                        _currentSidebarData[group] =  _filterFullData(_bookmarksDataCache[group], bookmarks[group]); 

                    }

                    //console.log(_bookmarksDataCache); 
                    //console.log(currentSidebarData); 

                    // pesquisar no cache os itens que estão no _getStorage() atual e enviar para o _loadsidebar
                    // _loadsidebar também vai ter acesso ao cache. 

                   _loadSidebar(_currentSidebarData);
                    
                    
                });

            }
            
            if (afterLoad)
                afterLoad(bookmarks);
        };


    return {
        init: _init
    }

})(jQuery, Handlebars);
