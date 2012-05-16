class Todo < ActiveRecord::Base
  attr_accessible :content, :done, :order, :due_date

  before_save :add_due_date

  def to_json(options = {})
    super(options.merge(:only => [ :id, :content, :order, :done, :due_date ]))
  end

  def add_due_date
  	self.due_date? ? return : self.due_date = (Time.now() + 86400)
  end
end
