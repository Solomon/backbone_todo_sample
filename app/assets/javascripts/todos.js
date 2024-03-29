// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Todo Model
  // ----------

  // Our basic **Todo** model has `content`, `order`, and `done` attributes.
  var Todo = Backbone.Model.extend({

    // Default attributes for the todo item.
    defaults: function() {
      return {
        content: "empty todo...",
        order: Todos.nextOrder(),
        due_date: Todos.tomorrow(),
        done: false
      };
    },

    // Ensure that each todo created has `content`.
    initialize: function() {
      if (!this.get("content")) {
        this.set({"content": this.defaults().content});
      }
      if (!this.get("due_date")) {
        this.set({"due_date": this.defaults().due_date});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    },

    url: function() {
      return this.id ? '/todos/' + this.id : '/todos';
    },

    // Remove this Todo from *localStorage* and delete its view.
    clear: function() {
      this.destroy();
    },

    format_due_date: function() {
      var date_to_format = this.get('due_date');
      // Check if the date is in the format we get from the rails api if so parse the date
      if (typeof date_to_format == "string") {
        var pattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;
        var match = pattern.exec(date_to_format);
        if (!match) {throw new Error('::Error, could not parse date');}
        var formatted_date = new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6]);
      }
      // check to see if the date is in the date format when it is created with a default date
      else if (date_to_format.getMonth()) {
        var formatted_date = date_to_format;
      }
      else {
        throw new Error('::Error, strange date format not found in format_due_date function');
      }
      var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
      return monthNames[formatted_date.getMonth()] + ' ' + formatted_date.getDate();
    },

    format_due_date_for_datepicker: function() {
      var date_to_format = this.get('due_date');
      // Check if the date is in the format we get from the rails api if so parse the date
      if (typeof date_to_format == "string") {
        var pattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;
        var match = pattern.exec(date_to_format);
        if (!match) {throw new Error('::Error, could not parse date');}
        var formatted_date = new Date(match[1], match[2]-1, match[3], match[4], match[5], match[6]);
      }
      // check to see if the date is in the date format when it is created with a default date
      else if (date_to_format.getMonth()) {
        var formatted_date = date_to_format;
      }
      else {
        throw new Error('::Error, strange date format not found in format_due_date function');
      }
      return (formatted_date.getMonth() + 1 ) + '/' + formatted_date.getDate() + '/' + formatted_date.getFullYear();
    }

  });

  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
  var TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,
    url: '/todos',

    // Save all of the todo items under the `"todos"` namespace.
    // localStorage: new Store("todos-backbone"),

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    tomorrow: function() {
      var today = new Date();
      var tomorrow = new Date(today.getTime() + (60*60*24*1000));
      return tomorrow;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }

  });

  // Create our global collection of **Todos**.
  var Todos = new TodoList;

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  var TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .todo_content"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close",
      "dblclick .todo_date" : "editDate",
      "keypress .edit_date" : "updateDateOnEnter",
      "blur .edit_date" : "closeDate"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the contents of the todo item.
    render: function() {
      var todo_json = this.model.toJSON();
      todo_json.formatted_date = this.model.format_due_date();
      todo_json.format_due_date_for_datepicker = this.model.format_due_date_for_datepicker();
      this.$el.html(this.template(todo_json));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      this.$el.addClass("editing");
      this.$('.edit').focus();
    },

    editDate: function() {
      this.$el.addClass("editing_date");
      // this.$('.edit_date').datepicker();
      this.$('.edit_date').focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      var value = this.$('.edit').val();
      if (!value) this.clear();
      this.model.save({content: value});
      this.$el.removeClass("editing");
    },

    closeDate: function() {
      var date_input = this.$('.edit_date').val();
      var sp = date_input.split("/");
      var d = new Date(sp[2],sp[0] - 1,sp[1],0,0,0);
      this.model.save({due_date: d});
      this.$el.removeClass("editing_date");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    updateDateOnEnter: function(e) {
      if (e.keyCode == 13) this.closeDate();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.clear();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-todo":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      Todos.bind('add', this.addOne, this);
      Todos.bind('reset', this.addAll, this);
      Todos.bind('all', this.render, this);

      this.footer = this.$('footer');
      this.main = $('#main');

      Todos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;

      if (Todos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne);
    },

    // If you hit return in the main input field, create new **Todo** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Todos.create({content: this.input.val()});
      this.input.val('');
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.each(Todos.done(), function(todo){ todo.clear(); });
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});
