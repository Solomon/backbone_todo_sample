require 'spec_helper'

describe Todo do

	before(:each) do
		@attr = {:content => "something", :due_date => Time.now()}
	end

	it "should create a todo with content" do
		Todo.create!(@attr)
	end

	describe "add due date function" do
	
		it "should add a date of tomorrow if date is blank" do
			@todo = Todo.new(:content => "something")
			@tomorrow = Time.now() + 86400
			@todo.add_due_date
			@todo.due_date.day.should == @tomorrow.day
		end

		it "should leave the due date if there is already a date" do
			@date = Time.now + 186400
			@todo = Todo.new(:content => "something", :due_date => @date)
			@todo.add_due_date
			@todo.due_date.should == @date
		end
	
	end

end