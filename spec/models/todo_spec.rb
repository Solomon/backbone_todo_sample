require 'spec_helper'

describe Todo do

	before(:each) do
		@attr = {:content => "something"}
	end

	it "should create a todo with content" do
		Todo.create!(@attr)
	end

end