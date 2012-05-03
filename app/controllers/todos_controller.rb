class TodosController < ApplicationController

  def index

     render :json => Todo.all

   end

   def show

     render :json => Todo.find(params[:id])

   end

   def create

     todo = Todo.create! params[:todo]

     render :json => todo

   end

   def update

     todo = Todo.find(params[:id])

     todo.update_attributes! params[:todo]

     render :json => todo

   end

   def destroy

    todo = Todo.find(params[:id])

    todo.destroy

    render :json => todo

  end

end