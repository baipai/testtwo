/* global redux, setting */
if( typeof debounce != 'function' ) {
    debounce=function(d,a,b){"use strict";var e;return function c(){var h=this,g=arguments,f=function(){if(!b){d.apply(h,g);}e=null};if(e){clearTimeout(e)}else{if(b){d.apply(h,g)}}e=setTimeout(f,a||100)}};
}

(function( $ ) {  //This functions first parameter is named $
    'use strict';

    redux.advanced_customizer = redux.advanced_customizer || {};

    $( document ).ready(
        function() {
            redux.advanced_customizer.init();

            //textarea reacting in customizer
            if(typeof $.redux !== 'undefined'){
                $( document.body ).on(
                    'keyup', '.redux-field input, .redux-field textarea', debounce( function() {
                        if ( !$( this ).hasClass( 'noUpdate' ) ) {
                            redux_change( $( this ) );
                        }
                    }, 600)
                );
            }
        }
    );

    redux.advanced_customizer.init = function() {
        $( '.accordion-section.redux-section h3, .accordion-section.redux-panel h3' ).click(
            function() {
                redux.advanced_customizer.resize( $( this ).parent() );
            }
        );

        $( '.control-panel-back, .customize-panel-back' ).click(function() {
            $( document ).find( 'form#customize-controls' ).removeAttr( 'style' );
            $( document ).find( '.wp-full-overlay' ).removeAttr( 'style' );
        });

        $( '.control-section-back, .customize-section-back' ).click(
            function() {
                $(".select2-drop").select2("close");
                redux.advanced_customizer.resize( $( this ).parents( '.redux-panel:first' ) );
            }
        );
    };

    redux.advanced_customizer.resize = function( el ) {
        var width = el.attr( 'data-width' );
        if ( $( 'body' ).width() < 640 ) {
            width = "";
        }
        if ( el.hasClass( 'open' ) || el.hasClass( 'current-panel' ) || el.hasClass( 'current-section' ) ) {
            if ( width != "" ) {
                $( document ).find( 'form#customize-controls' ).attr(
                    'style', 'width:' + width + ';'
                );
                $( document ).find( '.wp-full-overlay' ).attr(
                    'style', 'margin-left:' + width + ';'
                );
            }
        } else {
            width = el.parents( '.redux-panel:first' ).attr( 'data-width' );
            if ( !width ) {
                $( document ).find( 'form#customize-controls' ).removeAttr( 'style' );
                $( document ).find( '.wp-full-overlay' ).removeAttr( 'style' );
            } else {
                $( document ).find( 'form#customize-controls' ).attr(
                    'style', 'width:' + width + ';'
                );
                $( document ).find( '.wp-full-overlay' ).attr(
                    'style', 'margin-left:' + width + ';'
                );
            }
        }
    };

    $.redux.required = function() {
        var customizer_mode = $('body').hasClass('wp-customizer');//Apollo13MOD
        // Hide the fold elements on load ,
        // It's better to do this by PHP but there is no filter in tr tag , so is not possible
        // we going to move each attributes we may need for folding to tr tag
        $.each(
            redux.folds, function( i, v ) {
                var fieldset = $( '#' + redux.args.opt_name + '-' + i );

                fieldset.parents( 'tr:first' ).addClass( 'fold' );

                if ( v == "hide" ) {
                    if( customizer_mode ){//Apollo13MOD
                        fieldset.hide();//Apollo13MOD
                    }else {//Apollo13MOD
                        fieldset.parents('tr:first').addClass('hide');

                        if (fieldset.hasClass('redux-container-section')) {
                            var div = $('#section-' + i);

                            if (div.hasClass('redux-section-indent-start')) {
                                $('#section-table-' + i).hide().addClass('hide');
                                div.hide().addClass('hide');
                            }
                        }

                        if (fieldset.hasClass('redux-container-info')) {
                            $('#info-' + i).hide().addClass('hide');
                        }

                        if (fieldset.hasClass('redux-container-divide')) {
                            $('#divide-' + i).hide().addClass('hide');
                        }

                        if (fieldset.hasClass('redux-container-raw')) {
                            var rawTable = fieldset.parents().find('table#' + redux.args.opt_name + '-' + i);
                            rawTable.hide().addClass('hide');
                        }
                    }//Apollo13MOD
                }
            }
        );
    };

    $.redux.check_dependencies = function( variable ) {
        var customizer_mode = $('body').hasClass('wp-customizer');//Apollo13MOD
        if ( redux.required === null ) {
            return;
        }

        var current = $( variable ),
            id = current.parents( '.redux-field:first' ).data( 'id' );

        if ( !redux.required.hasOwnProperty( id ) ) {
            return;
        }

        var container = current.parents( '.redux-field-container:first' ),
            is_hidden = container.parents( 'tr:first' ).hasClass( '.hide' );

        if ( !container.parents( 'tr:first' ).length ) {
            is_hidden = container.parents( '.customize-control:first' ).hasClass( '.hide' );
        }
        if( customizer_mode ){//Apollo13MOD
            is_hidden = false;//Apollo13MOD
        }//Apollo13MOD
        $.each(
            redux.required[id], function( child, dependents ) {

                var current = $( this ),
                    show = false,
                    childFieldset = $( '#' + redux.args.opt_name + '-' + child ),
                    tr = childFieldset.parents( 'tr:first' );

                if( customizer_mode ){//Apollo13MOD
                    tr = childFieldset;//Apollo13MOD
                }//Apollo13MOD
                if ( !is_hidden ) {
                    show = $.redux.check_parents_dependencies( child );
                }

                if ( show === true ) {
                    // Shim for sections
                    if ( childFieldset.hasClass( 'redux-container-section' ) ) {
                        var div = $( '#section-' + child );

                        if ( div.hasClass( 'redux-section-indent-start' ) && div.hasClass( 'hide' ) ) {
                            $( '#section-table-' + child ).fadeIn( 300 ).removeClass( 'hide' );
                            div.fadeIn( 300 ).removeClass( 'hide' );
                        }
                    }

                    if ( childFieldset.hasClass( 'redux-container-info' ) ) {
                        $( '#info-' + child ).fadeIn( 300 ).removeClass( 'hide' );
                    }

                    if ( childFieldset.hasClass( 'redux-container-divide' ) ) {
                        $( '#divide-' + child ).fadeIn( 300 ).removeClass( 'hide' );
                    }

                    if ( childFieldset.hasClass( 'redux-container-raw' ) ) {
                        var rawTable = childFieldset.parents().find( 'table#' + redux.args.opt_name + '-' + child );
                        rawTable.fadeIn( 300 ).removeClass( 'hide' );
                    }

                    tr.fadeIn(
                        300, function() {
                            $( this ).removeClass( 'hide' );
                            if ( redux.required.hasOwnProperty( child ) ) {
                                $.redux.check_dependencies( $( '#' + redux.args.opt_name + '-' + child ).children().first() );
                            }
                            $.redux.initFields();
                        }
                    );
                    if ( childFieldset.hasClass( 'redux-container-section' ) || childFieldset.hasClass( 'redux-container-info' ) ) {
                        tr.css( {display: 'none'} );
                    }
                } else if ( show === false ) {
                    tr.fadeOut(
                        100, function() {
                            $( this ).addClass( 'hide' );
                            if ( redux.required.hasOwnProperty( child ) ) {
                                //console.log('Now check, reverse: '+child);
                                $.redux.required_recursive_hide( child );
                            }
                        }
                    );
                }

                current.find( 'select, radio, input[type=checkbox]' ).trigger( 'change' );
            }
        );
    };

    $.redux.check_dependencies_visibility = function( parentValue, data ) {
        var show = false,
            checkValue = data.checkValue,
            operation = data.operation,
            arr,
            customizer_mode = $('body').hasClass('wp-customizer');//Apollo13MOD

        //Apollo13MOD
        if(customizer_mode){
            if ($.isPlainObject(parentValue)) {
                parentValue = Object.keys(parentValue).map(function (key) {return parentValue[key]});
            }
            if ( !$.isArray( parentValue[0] ) ) {
                parentValue =  parentValue[0];
            }
        }
        //Apollo13MOD END
        switch ( operation ) {
            case '=':
            case 'equals':
                if ( $.isArray( parentValue ) ) {
                    $( parentValue[0] ).each(
                        function( idx, val ) {
                            if ( $.isArray( checkValue ) ) {
                                $( checkValue ).each(
                                    function( i, v ) {
                                        if ( val == v ) {
                                            show = true;
                                            return true;
                                        }
                                    }
                                );
                            } else {
                                if ( val == checkValue ) {
                                    show = true;
                                    return true;
                                }
                            }
                        }
                    );
                } else {
                    if ( $.isArray( checkValue ) ) {
                        $( checkValue ).each(
                            function( i, v ) {
                                if ( parentValue == v ) {
                                    show = true;
                                }
                            }
                        );
                    } else {
                        if ( parentValue == checkValue ) {
                            show = true;
                        }
                    }
                }
                break;

            case '!=':
            case 'not':
                if ( $.isArray( parentValue ) ) {
                    $( parentValue ).each(
                        function( idx, val ) {
                            if ( $.isArray( checkValue ) ) {
                                $( checkValue ).each(
                                    function( i, v ) {
                                        if ( val != v ) {
                                            show = true;
                                            return true;
                                        }
                                    }
                                );
                            } else {
                                if ( val != checkValue ) {
                                    show = true;
                                    return true;
                                }
                            }
                        }
                    );
                } else {
                    if ( $.isArray( checkValue ) ) {
                        $( checkValue ).each(
                            function( i, v ) {
                                if ( parentValue != v ) {
                                    show = true;
                                }
                            }
                        );
                    } else {
                        if ( parentValue != checkValue ) {
                            show = true;
                        }
                    }
                }
                break;

            case '>':
            case 'greater':
            case 'is_larger':
                if ( parseFloat( parentValue ) > parseFloat( checkValue ) ) {
                    show = true;
                }
                break;

            case '>=':
            case 'greater_equal':
            case 'is_larger_equal':
                if ( parseFloat( parentValue ) >= parseFloat( checkValue ) ) {
                    show = true;
                }
                break;

            case '<':
            case 'less':
            case 'is_smaller':
                if ( parseFloat( parentValue ) < parseFloat( checkValue ) ) {
                    show = true;
                }
                break;

            case '<=':
            case 'less_equal':
            case 'is_smaller_equal':
                if ( parseFloat( parentValue ) <= parseFloat( checkValue ) ) {
                    show = true;
                }
                break;

            case 'contains':
                if ( $.isPlainObject( parentValue ) ) {
                    parentValue = Object.keys( parentValue ).map(
                        function( key ) {
                            return [key, parentValue[key]];
                        }
                    );
                }

                if ( $.isPlainObject( checkValue ) ) {
                    checkValue = Object.keys( checkValue ).map(
                        function( key ) {
                            return [key, checkValue[key]];
                        }
                    );
                }

                if ( $.isArray( checkValue ) ) {
                    $( checkValue ).each(
                        function( idx, val ) {
                            var breakMe = false;
                            var toFind = val[0];
                            var findVal = val[1];

                            $( parentValue ).each(
                                function( i, v ) {
                                    var toMatch = v[0];
                                    var matchVal = v[1];

                                    if ( toFind === toMatch ) {
                                        if ( findVal == matchVal ) {
                                            show = true;
                                            breakMe = true;

                                            return false;
                                        }
                                    }
                                }
                            );

                            if ( breakMe === true ) {
                                return false;
                            }
                        }
                    );
                } else {
                    if ( parentValue.toString().indexOf( checkValue ) !== -1 ) {
                        show = true;
                    }
                }
                break;

            case 'doesnt_contain':
            case 'not_contain':
                if ( $.isPlainObject( parentValue ) ) {
                    arr = Object.keys( parentValue ).map(
                        function( key ) {
                            return parentValue[key];
                        }
                    );
                    parentValue = arr;
                }

                if ( $.isPlainObject( checkValue ) ) {
                    arr = Object.keys( checkValue ).map(
                        function( key ) {
                            return checkValue[key];
                        }
                    );
                    checkValue = arr;
                }

                if ( $.isArray( checkValue ) ) {
                    $( checkValue ).each(
                        function( idx, val ) {
                            if ( parentValue.toString().indexOf( val ) === -1 ) {
                                show = true;
                            }
                        }
                    );
                } else {
                    if ( parentValue.toString().indexOf( checkValue ) === -1 ) {
                        show = true;
                    }
                }
                break;

            case 'is_empty_or':
                if ( parentValue === "" || parentValue == checkValue ) {
                    show = true;
                }
                break;

            case 'not_empty_and':
                if ( parentValue !== "" && parentValue != checkValue ) {
                    show = true;
                }
                break;

            case 'is_empty':
            case 'empty':
            case '!isset':
                if ( !parentValue || parentValue === "" || parentValue === null ) {
                    show = true;
                }
                break;

            case 'not_empty':
            case '!empty':
            case 'isset':
                if ( parentValue && parentValue !== "" && parentValue !== null ) {
                    show = true;
                }
                break;
        }
        return show;

    };

    $.redux.initFields = function() {
        var selector = $('#customize-theme-controls')
            .find('ul.open, li.open')//li.open is for WP < 4.7
            .find('li.redux-group-tab').filter(':visible');

        selector.find( ".redux-field-init").filter(':visible').each(
            function() {
                var type = $( this ).attr( 'data-type'),
                    new_selector = selector.find('.redux-container-'+type+':visible');

                if ( typeof redux.field_objects != 'undefined' && redux.field_objects[type] && redux.field_objects[type] ) {
                    redux.field_objects[type].init(new_selector);
                }
                if ( !redux.customizer && $( this ).hasClass( 'redux_remove_th' ) ) {

                    var tr = $( this ).parents( 'tr:first' );
                    var th = tr.find( 'th:first' );
                    if ( th.html() && th.html().length > 0 ) {
                        $( this ).prepend( th.html() );
                        $( this ).find( '.redux_field_th' ).css( 'padding', '0 0 10px 0' );
                    }
                    $( this ).parent().attr( 'colspan', '2' );
                    th.remove();
                }
            }
        );
    };

})( jQuery );